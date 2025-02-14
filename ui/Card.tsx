import Link from 'next/link';
import Image from 'ui/Image';

interface IProps {
	/* eslint-disable react/require-default-props */
	img?: string,
	title: string,
	description: string,
	button: string,
	url: string,
	internal?: boolean,
	/* eslint-enable */
}

export default function Card({
	img, title, description, button, url, internal,
}: IProps) {
	return (
		<div className="mt-4 w-full sm:w-1/3">
			<div
				className="p-8 h-full border-b-4 rounded-lg flex flex-col justify-between items-center sm:mx-2 sm:p-3 md:p-8
			 bg-skin-card dark:bg-skin-dark-card border-skin-primary-1 dark:border-skin-dark-primary-1"
			>
				<div className="flex flex-col items-center">
					{img
						&& <Image className="h-32 rounded-full" src={img} alt="" width={128} height={128} />}
					<h2 className="font-bold text-xl mt-3 text-center text-black dark:text-white">
						{title}
					</h2>
					<p className="text-center mt-2 text-black dark:text-white text-opacity-80">
						{description}
					</p>
				</div>
				{internal ? (
					<Link
						href={url}
						className="rounded-3xl font-bold w-20 h-10 flex items-center justify-center mt-4 content-end cursor-pointer
							bg-skin-secondary-1 dark:bg-skin-dark-secondary-1 text-white hover:text-opacity-70"
					>
						{button}
					</Link>
				) : (
					<a href={url}>
						<div
							className="rounded-3xl font-bold w-20 h-10 flex items-center justify-center mt-4 content-end cursor-pointer
							bg-skin-secondary-1 dark:bg-skin-dark-secondary-1 text-white hover:text-opacity-70"
						>
							{button}
						</div>
					</a>
				)}
			</div>
		</div>
	);
}
