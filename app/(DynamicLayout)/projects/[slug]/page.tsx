import {
	Flag, Guild, Media, Project,
} from 'types/payload-types';
import DescriptionSerializer from 'ui/DescriptionSerializer';
import TextHeader from 'ui/TextHeader';
import PayloadResponse from 'types/PayloadResponse';
import Submissions from 'ui/project/Submissions';
import Gallery from 'ui/project/Gallery';
import ExperimentalProjectPage from 'ui/project/experimental/sana/Page';
import PhaserSubmissionWrapper from 'ui/project/guratanabata/PhaserSubmissionWrapper';
import { notFound } from 'next/navigation';
import { getImageUrl } from 'ui/Image';
import { Metadata } from 'next';

// ID's for both production and development databases
// TODO: Replace with Payload data
const ID_TO_STYLE_MAP = new Map<string, string>();
ID_TO_STYLE_MAP.set('62c16ca2b919eb349a6b09ba', 'theme-ina');

// Development testing ID's
ID_TO_STYLE_MAP.set('62c9442ff1ee39aa37afc4c7', 'theme-ina');
ID_TO_STYLE_MAP.set('63209a0af2be5d1c9590fb62', 'theme-sana');

interface IProps {
	params: {
		slug: string;
	}
}

// NOTE: jp property should *ONLY* be used for translations, not everything is populated here
interface ProjectData {
	project: {
		en: Omit<Project, 'flags' | 'devprops'> & {
			flags: string[];
			devprops: {
				[key: string]: string;
			};
		};
		jp: {
			title: Project['title'];
			shortDescription: Project['shortDescription'];
			description: Project['description'];
		};
	};
}

async function fetchProject(slug: string): Promise<ProjectData | null> {
	// Fetch EN and JP version for page, CMS will fallback to EN for any fields not translated
	const enProjectRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/projects?where[slug][like]=${slug}&depth=2`, {
		headers: {
			'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? '',
		} as Record<string, string>,
	});

	const res = (await enProjectRes.json() as PayloadResponse<Project>);
	if (res.totalDocs === 0) return null;

	const enProject = res.docs[0];
	const flags = (enProject.flags as Flag[] ?? []).map((flag) => flag.code);

	const jpProjectRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/projects?where[slug][like]=${slug}&depth=0&locale=jp`, {
		headers: {
			'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? '',
		} as Record<string, string>,
	});
	const jpProject = (await jpProjectRes.json() as PayloadResponse<Project>).docs[0];

	return {
		project: {
			en: {
				...enProject,
				media: enProject.media.map((item) => {
					if (!item.media) return item;

					return {
						...item,
						media: {
							...item.media as Media,
							url: getImageUrl({ src: (item.media as Media).url!, width: 1024 }),
						} as Media,
					};
				}),
				flags,
				// eslint-disable-next-line max-len
				devprops: enProject.devprops ? enProject.devprops.reduce((a, v) => ({ ...a, [v.key]: v.value }), {}) : {},
			},
			jp: {
				title: jpProject.title ?? null,
				shortDescription: jpProject.shortDescription ?? null,
				description: jpProject.description ?? null,
			},
		},
	};
}

// eslint-disable-next-line max-len
export default async function ProjectPage({ params }: IProps) {
	const res = await fetchProject(params.slug);
	if (res === null) {
		notFound();
	}

	const { project } = res;

	// const ref = useMemo(() => createRef<BlurBackground>(), []);

	const themeStyle = ID_TO_STYLE_MAP.get((project.en.organizer as Guild).id);

	if (project.en.flags?.includes('experimental')) {
		return (
			// @ts-ignore
			<ExperimentalProjectPage project={project} />
		);
	}

	if (project.en.flags?.includes('guratanabata')) {
		return (
			// @ts-ignore
			<PhaserSubmissionWrapper project={project.en} />
		);
	}

	return (
		<div className={themeStyle}>
			<div className="flex flex-col h-full min-h-screen bg-skin-background-1 dark:bg-skin-dark-background-1">
				<div className="flex-grow">
					<div className="mb-16 mt-4 w-full flex flex-col items-center">
						<div className="max-w-full w-full sm:!max-w-4xl px-4 break-words md:break-normal">
							<div className="description-body">
								{DescriptionSerializer(project.en.description)}
							</div>
							{(project.en.media?.length ?? 0) > 0 && (
								<Gallery project={project.en as any} />
							)}
							{(project.en.links?.length ?? 0) > 0 && (
								<div className="mt-4">
									<TextHeader>Links</TextHeader>
									<div className="flex justify-center space-x-6 px-4 sm:px-0">
										{project.en.links
												&& project.en.links.map((link) => (
													<div
														key={`link-${link.name}-${link.url}`}
														className="rounded-3xl font-bold w-[6rem] h-10 flex items-center justify-center mt-4 content-end
													bg-skin-secondary-1 dark:bg-skin-dark-secondary-1 text-white hover:text-opacity-70"
													>
														<a href={link.url} target="_blank" rel="noreferrer">
															{link.name}
														</a>
													</div>
												))}
									</div>
								</div>
							)}
							{/* TODO: Move submissions to separate tab */}
							<div className="mt-4">
								{!(project.en.flags.includes('disableTabs') || project.en.flags.includes('filterableSubmissions')) && (
									<TextHeader>Submissions</TextHeader>
								)}
								{/* @ts-ignore */}
								<Submissions project={project.en} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export async function generateStaticParams() {
	let projects: Project[] = [];
	let moreProjects = true;
	let page = 1;

	async function fetchNextProjects() {
		// Fetch next page
		const enProjectsRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/projects?depth=0&limit=100&page=${page}&depth=0`, {
			headers: {
				'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? '',
			} as Record<string, string>,
		});
		const enBody: PayloadResponse<Project> = await enProjectsRes.json();

		projects = projects.concat(enBody.docs);

		// Set variables for next fetch
		page += 1;
		moreProjects = enBody.hasNextPage;
	}

	while (moreProjects) {
		// eslint-disable-next-line no-await-in-loop
		await fetchNextProjects();
	}

	return projects.map((project) => (
		{
			slug: project.slug,
		}
	));
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
	const enProjectRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/projects?where[slug][like]=${params.slug}&depth=2`, {
		headers: {
			'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? '',
		} as Record<string, string>,
	});
	const parsedEnProjectRes = (await enProjectRes.json() as PayloadResponse<Project>);
	if (parsedEnProjectRes.totalDocs === 0) return notFound();
	const enProject = parsedEnProjectRes.docs[0];

	// eslint-disable-next-line max-len
	/* const jpProjectRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/projects?where[slug][like]=${slug}&depth=0&locale=jp`, {
		headers: {
			'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? '',
		} as Record<string, string>,
	});
	const jpProject = (await jpProjectRes.json() as PayloadResponse<Project>).docs[0]; */

	return {
		title: enProject.title,
		description: enProject.shortDescription,
		openGraph: {
			title: enProject.title,
			description: enProject.shortDescription,
			type: 'website',
			siteName: 'HoloEN Fan Website',
		},
		twitter: {
			title: enProject.title,
			description: enProject.shortDescription,
			// eslint-disable-next-line max-len
			images: getImageUrl({ src: (enProject.ogImage as Media | undefined)?.url ?? (enProject.image as Media).url!, width: 1024 }),
			site: '@HEF_Website',
			creator: '@GoldElysium',
			card: 'summary_large_image',
		},
	};
}
