import type { GetStaticPaths, GetStaticPropsContext, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from "next/error"
import { ProfileImage } from "~/components/ProfileImage";
import Link from "next/link";
import { Button } from "~/components/Button";
import { useState, FormEvent } from "react";
const ProfilePage: NextPage<InferGetServerSidePropsType<typeof getStaticProps>> = ({ id }) => {
    const apiProfile = api.profile;
    const { data: profile } = apiProfile.getById.useQuery({ id })
    const updateUser = apiProfile.updateUser.useMutation();
    const [inputValue, setInputValue] = useState("");
    if (profile == null || profile.name == null) return <ErrorPage statusCode={404} />
    const [name, setName] = useState(profile.name);
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        updateUser.mutate({ name: inputValue, id: id });
        setName(inputValue);
    }
    return (
        <>
            <Head>
                <title>
                    {`${name}`}
                </title>
            </Head>
            <li className="flex gap-4 border px-4 py-4"> <ProfileImage src={profile.image} className="w-24 h-24" />
                <h1 className="mb-2 px-4 text-lg font-bold text-center hover:animate-pulse">{name}</h1>
            </li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Followers: {profile.followersCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Follows: {profile.followsCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Tweets: {profile.tweetsCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Liked posts: {profile.likesCount}</li>
            <li className="flex gap-4 hover:animate-pulse">
                <form onSubmit={handleSubmit} className="">

                    <input value={inputValue} className="border" onChange={(e) => setInputValue(e.target.value)} placeholder="username" />

                    <Button className="self-end">Change Username</Button>
                </form>
            </li>
            <li className="flex gap-4 hover:animate-pulse">
                <Link href={`/ `} className="p-5 bg-red-200 rounded-xl">
                    Back
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