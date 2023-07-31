import Image from "next/image";
import Link from "next/link";
type ProfileImageProps = {
    src?: string | null
    className?: string
}

export function ProfileImage({ src, className = "" }: ProfileImageProps) {
    return <div className={`relative h-12 w-12 overflow-hidden rounded-full hover:animate-spin ${className} `}>
        {src == null ? null : (
            <Link href={src} target="_blank" >
                <Image src={src} alt="profile image" quality={100} fill />
            </Link>
        )}
    </div>
}