import discord from '@icons/community/discord.svg'
import github from '@icons/community/github.svg';
import medium from '@icons/community/medium.svg';
import twitter from '@icons/community/twitter.svg';

export interface CommunityItem {
    logo: React.FunctionComponent<React.SVGProps<SVGSVGElement>>; 
    id: string;
    href: string;
    title?: string;
    desc?: string;
    disable?: boolean;
}

export const communityGithub: CommunityItem = {
  id: 'github',
  href: 'https://github.com',
  logo: github,
};

export const communityTwitter: CommunityItem = {
  id: 'twitter',
  href: 'https://twitter.com',
  logo: twitter,
};

export const communityDiscord: CommunityItem = {
  id: 'discord',
  href: 'https://discord.com',
  logo: discord,
};

export const communityMedium: CommunityItem = {
  id: 'medium',
  href: 'https://medium.com',
  logo: medium,
};

export const communities = [communityGithub, communityTwitter, communityDiscord, communityMedium];

export default communities;
