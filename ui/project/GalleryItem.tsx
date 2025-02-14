'use client';

import { Media, Project } from 'types/payload-types';
import ReactPlayer from 'react-player';
import Image from 'next/image';

interface GalleryItemProps {
	media: Array<Omit<Project['media'][number], 'media'> & { media: Media }>;
	index: number;
}

export default function GalleryItem({ media, index }: GalleryItemProps) {
	if (!media) return null;

	if (media[index].type === 'video') {
		return (
			<ReactPlayer
				width="100%"
				height="100%"
				key={media[index].id!}
				url={media[index].url!}
				controls
				light
			/>
		);
	}
	if (media[index].type === 'image') {
		return (
			<Image
				className="max-w-full max-h-full object-contain"
				key={media[index].id!}
				src={media[index].media.url!}
				width={
					media[index].media.width! < 1024 ? media[index].media.width : 1024
				}
				height={
					media[index].media.width! < 1024
						? media[index].media.height!
						: (media[index].media.height! / media[index].media.width!) * 1024
				}
				alt=""
			/>
		);
	}

	return <p>Invalid media</p>;
}
