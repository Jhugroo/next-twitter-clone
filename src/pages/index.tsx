import { InfiniteTweetsList } from "~/components/InfiniteTweetsList";
import { NewTweetForm } from "~/components/NewTweetForm";
import { api } from "~/utils/api";
import { useSession } from 'next-auth/react';
import { useState, useEffect } from "react";
import Modal from "~/components/Modal";
const TABS = ['Recent', 'Following'] as const

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<(typeof TABS)[number]>('Recent')
  const session = useSession();
  let state: boolean = true
  return (
    <>
      {session.status === "unauthenticated" ? <Modal title="Welcome to scuffed twitter" text="Do whatever you want with it" buttonText="Got it Thanks!!" state={state} /> : <></>}
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
        <div className="flex">
          {TABS.map(tab => {
            return <button key={tab} className={`flex-grow p-2 hover:bg-gray-200 focus-visible:bg-gray-200 
              ${tab === selectedTab
                ? "border-b-4 border-blue-500 font-bold"
                : " "}`}
              onClick={() => setSelectedTab(tab)}>{tab}</button>
          })}
        </div>
      </header>
      <NewTweetForm />
      {selectedTab === "Recent" ? < RecentTweets /> : <FollowingTweets />}
    </>
  );
}

function FollowingTweets() {
  const tweets = api.tweet.infiniteFeed.useInfiniteQuery({ onlyFollowing: true }, { getNextPageParam: (lastPage) => lastPage.nextCursor })
  return <InfiniteTweetsList
    tweets={tweets.data?.pages.flatMap((page) => page.tweets)} isError={tweets.isError}
    isLoading={tweets.isLoading}
    hasMore={tweets.hasNextPage}
    fetchNewTweets={tweets.fetchNextPage}
  />
}

function RecentTweets() {
  const tweets = api.tweet.infiniteFeed.useInfiniteQuery({}, { getNextPageParam: (lastPage) => lastPage.nextCursor })

  return <InfiniteTweetsList
    tweets={tweets.data?.pages.flatMap((page) => page.tweets)} isError={tweets.isError}
    isLoading={tweets.isLoading}
    hasMore={tweets.hasNextPage}
    fetchNewTweets={tweets.fetchNextPage}
  />
}