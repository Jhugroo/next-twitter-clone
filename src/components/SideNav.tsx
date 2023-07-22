import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { IconHoverEffect } from "./IconHoverEffect";
import Image from "next/image";

export function SideNav() {
    const session = useSession()
    const user = session.data?.user
    return <nav className="sticky- top-0 px-2 py-4">
        <ul className="flex flex-col items-start gap-2 whitespace-nowrap">
            <li>
                <IconHoverEffect><Link href="/"> <Image src="https://cdn.discordapp.com/attachments/1088146625052028940/1131487531809132554/IMG-20230714-WA0001.jpg" alt="profile image" quality={100} width={200} height={200} /> </Link></IconHoverEffect>
            </li>
            {user != null && <li>
                <Link href={`/profiles/${user.id}`}>Profile</Link>
            </li>}
            {user == null ? (
                <li>
                    <button onClick={() => void signIn()}>
                        Login
                    </button>
                </li>
            ) :
                (<li>

                    <button onClick={() => void signOut()}>
                        Logout
                    </button>
                </li>)
            }
        </ul>
    </nav>
}