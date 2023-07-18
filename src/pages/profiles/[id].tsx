import type { GetStaticPaths, GetStaticPropsContext, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from "next/error"
import { ProfileImage } from "~/components/ProfileImage";
import Link from "next/link";
const ProfilePage: NextPage<InferGetServerSidePropsType<typeof getStaticProps>> = ({ id }) => {
    const { data: profile } = api.profile.getById.useQuery({ id })

    if (profile == null || profile.name == null) return <ErrorPage statusCode={404} />
    return (
        <>
            <Head>
                <title>
                    {`${profile.name}`}
                </title>
            </Head>
            <li className="flex gap-4 border px-4 py-4"> <ProfileImage src={profile.image} className="w-24 h-24" />
                <h1 className="mb-2 px-4 text-lg font-bold text-center hover:animate-pulse">{profile.name}</h1>
            </li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Followers: {profile.followersCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Follows: {profile.followsCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Tweets: {profile.tweetsCount}</li>
            <li className="flex gap-4 border px-4 py-4 hover:animate-pulse">Liked posts: {profile.likesCount}</li>
            <li className="flex gap-4 hover:animate-pulse">
                <Link href={`/`} className="p-5 bg-red-200 hover:anime-">
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