import type { GetStaticPaths, GetStaticPropsContext, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from "next/error"
import { ProfileImage } from "~/components/ProfileImage";
import Link from "next/link";
import { Button } from "~/components/Button";
import { useState, FormEvent } from "react";
import { InfiniteTweetsList } from "~/components/InfiniteTweetsList";
const ProfilePage: NextPage<InferGetServerSidePropsType<typeof getStaticProps>> = ({ id }) => {
    const apiProfile = api.profile;
    const { data: profile } = apiProfile.getById.useQuery({ id })
    const tweets = api.tweet.infiniteFeed.useInfiniteQuery({ currentId: id }, { getNextPageParam: (lastPage) => lastPage.nextCursor })
    const updateUser = apiProfile.updateUser.useMutation();
    const updateTweet = api.tweet.updateTweet.useMutation();
    const [inputValueTweet, setInputValueTweet] = useState("");
    const [inputValueId, setInputValueId] = useState("");
    const [inputValue, setInputValue] = useState("");


    if (profile == null || profile.name == null) return <ErrorPage statusCode={404} />
    const [name, setName] = useState(profile.name);
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        updateUser.mutate({ name: inputValue, id: id });
        setName(inputValue);
    }
    function handleSubmitTweet(e: FormEvent) {
        e.preventDefault();
        updateTweet.mutate({ content: inputValueTweet, id: inputValueId });
    }
    return (
        <>
            <Head>
                <title>
                    {`${name}`}
                </title>
            </Head>
            <li className="flex gap-4 border px-4 py-4">
                <ProfileImage src={profile.image} className="w-24 h-24" />
                <h1 className="mb-2 px-4 text-lg font-bold text-center hover:animate-pulse">{name}</h1>
            </li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Followers: {profile.followersCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Follows: {profile.followsCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Tweets: {profile.tweetsCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Liked posts: {profile.likesCount}</li>
            <li className="flex gap-4 hover:animate-pulse">
                <form onSubmit={handleSubmit}>
                    <input value={inputValue} className="border" onChange={(e) => setInputValue(e.target.value)} placeholder="username" />
                    <Button className="self-end">Change Username</Button>
                </form>
            </li>
            <li className="flex gap-4 hover:animate-pulse">
                <form onSubmit={handleSubmitTweet}>
                    <input value={inputValueId} className="border" onChange={(e) => setInputValueId(e.target.value)} placeholder="id" />
                    <input value={inputValueTweet} className="border" onChange={(e) => setInputValueTweet(e.target.value)} placeholder="tweet" />
                    <Button className="self-end">Change Username</Button>
                </form>
            </li>
            <li className="flex gap-4">    Your tweets
            </li>
            <li className="flex gap-4">
                <InfiniteTweetsList
                    tweets={tweets.data?.pages.flatMap((page) => page.tweets)} isError={tweets.isError}
                    isLoading={tweets.isLoading}
                    hasMore={tweets.hasNextPage}
                    hideProfile={true}
                    fetchNewTweets={tweets.fetchNextPage}
                />
                <Link href={`/ `}>
                    <button className="bg-red-300 rounded-full px-4 py-2 font-bold"> Back
                    </button>
                </Link>
            </li>
        </>
    );
}

export const getStaticPaths: GetStaticPaths = () => {
    return {
        paths: [],
        fallback: "blocking",
    }
}

export async function getStaticProps(context: GetStaticPropsContext<{ id: string }>) {
    const id = context.params?.id
    if (id == null) {
        return {
            redirect: {
                destination: "/"
            }
        }
    }
    const ssg = ssgHelper()
    await ssg.profile.getById.prefetch({ id })

    return {
        props: {
            trpcState: ssg.dehydrate(),
            id,
        }
    }
}
export default ProfilePage;