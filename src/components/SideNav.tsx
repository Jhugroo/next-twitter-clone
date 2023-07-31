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
                <IconHoverEffect><Link href="/"> <Image src="https://cdn.icon-icons.com/icons2/2620/PNG/512/among_us_player_red_icon_156942.png" alt="profile image" quality={100} width={100} height={100} /> </Link></IconHoverEffect>
            </li>
            {user != null && <><li>
                <Link href={`/profiles/${user.id}`}>Profile</Link>
            </li>
                <li>
                    <Link href="/mytodos">My tasks</Link>
                </li></>}
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