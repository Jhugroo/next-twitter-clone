import InfiniteScroll from 'react-infinite-scroll-component';
import { ProfileImage } from './ProfileImage';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { useSession } from 'next-auth/react';
import { VscHeartFilled, VscHeart } from "react-icons/vsc";
import { IconHoverEffect } from './IconHoverEffect';
import { api } from '~/utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
type Tweet = {
    id: string,
    content: string,
    createdAt: Date,
    likeCount: number,
    likedByMe: boolean,
    user: { id: string, image: string | null, name: string | null },
    hideProfile?: boolean
    isEditable?: boolean
};
type InfiniteTweetListProps = {
    isLoading: boolean,
    isError: boolean,
    hasMore: boolean | undefined,
    fetchNewTweets: () => Promise<unknown>
    tweets?: Tweet[]
    hideProfile?: boolean
    isEditable?: boolean
}

export function InfiniteTweetsList({ tweets, isError, isLoading, fetchNewTweets, hasMore = false, hideProfile = false, isEditable = false }: InfiniteTweetListProps) {

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <h1>Error...</h1>;
    if (tweets == null) return null;

    if (tweets == null || tweets.length === 0) {
        return <h2 className="my-4 text-center text-2x; text-gray-500">No tweets</h2>;
    }

    return <ul>
        <InfiniteScroll
            dataLength={tweets.length}
            next={fetchNewTweets}
            hasMore={hasMore}
            loader={<LoadingSpinner />}>
            {tweets.map((tweet) => { return <TweetCard isEditable={isEditable} hideProfile={hideProfile} key={tweet.id} {...tweet} /> })}
        </InfiniteScroll>
    </ul>
}

const datetimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "short" });

function TweetCard({ id, user, content, createdAt, likeCount, likedByMe, hideProfile = false, isEditable = false }: Tweet) {
    const trpcUtils = api.useContext();
    const updateTweet = api.tweet.updateTweet.useMutation();
    const { register, handleSubmit } = useForm();
    const toggleLike = api.tweet.toggleLike.useMutation({
        onSuccess: ({ addedLike }) => {
            const updateData: Parameters<typeof trpcUtils.tweet.infiniteFeed.setInfiniteData>[1]
                = (oldData) => {
                    if (oldData == null) return
                    const countModifier = addedLike ? 1 : -1
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => {
                            return {
                                ...page,
                                tweets: page.tweets.map(tweet => {
                                    if (tweet.id === id) {
                                        return {
                                            ...tweet,
                                            likeCount: tweet.likeCount + countModifier,
                                            likedByMe: addedLike
                                        }
                                    }
                                    return tweet
                                })
                            }
                        })
                    }
                }
            trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
        },
    });
    function handleToggleLike() {
        toggleLike.mutate({ id });
    }
    function handleSubmitTweet(data: any) {
        updateTweet.mutate({ content: data.content, id: data.id });
    }
    if (hideProfile == true) {
        return <li className="flex gap-4 border px-4 py-4">
            <div className='flex flex-grow flex-col'>
                <p className="whitespace-pre-wrap">{content} </p>
                {isEditable == true && (
                    <form onSubmit={handleSubmit(handleSubmitTweet)}>
                        <input {...register("id")} className="border" placeholder="id" value={id} type="hidden" />
                        <input {...register("content")} className="border" placeholder="tweet" />
                        <Button className="self-end">Change Tweet</Button>
                    </form>
                )}
            </div>
        </li>
    }
    return <li className="flex gap-4 border px-4 py-4">
        <Link href={`/profiles/${user.id}`} >
            <ProfileImage src={user.image} />
        </Link>
        <div className='flex flex-grow flex-col'>
            <div className="flex gap-1">
                <Link href={`/profiles/${user.id}`} className="font-bold hover:underline" >{user.name}</Link>
                <span className="text-gray-500">{datetimeFormatter.format(createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap">{content}</p>
            <HeartButton onClick={handleToggleLike} isLoading={toggleLike.isLoading} likedByMe={likedByMe} likeCount={likeCount} />
        </div>
    </li>
}

type HeartButtonProps = {
    onClick: () => void
    isLoading: boolean
    likedByMe: boolean
    likeCount: number
}

function HeartButton({ isLoading, onClick, likedByMe, likeCount }: HeartButtonProps) {
    const session = useSession();
    const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;
    if (session.status !== "authenticated") {
        return <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
            <HeartIcon />
            <span>{likeCount}</span>
        </div>
    }
    return (
        <button
            disabled={isLoading}
            onClick={onClick}
            className={`group items-center gap-1 self-start flex transition-colors duration-200 ${likedByMe
                ? "text-red-500"
                : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
                }`}>
            <IconHoverEffect red>
                <HeartIcon
                    className={`transition-colors duration-200 ${likedByMe
                        ? "fill-red-500"
                        : "fill-red-500 group-hover:fill-500 group-focus-visible:fill-red-500"
                        }`} />
            </IconHoverEffect>
            <span>{likeCount}</span>
        </button>
    );
}