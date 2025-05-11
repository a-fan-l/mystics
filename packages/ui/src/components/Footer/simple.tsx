'use client';

import * as React from 'react';

import Version, { VersionsProps } from './version';
import Community, { CommunityProps } from './community';

export interface SimpleProps {
  className?: string;
  isVersion?: boolean;
  isCommunity?: boolean;
  version?: VersionsProps;
  community?: CommunityProps;
  name?: string;
}

const Index: React.FC<SimpleProps> = ({
  className,
  isVersion = true,
  isCommunity = true,
  version,
  community,
  name,
}) => {
  return (
    <footer className={`footer-root w-full ${className} ${name}`}>
      <div className="footer-content">
        {isVersion && <Version {...version} />}
        {isCommunity && <Community {...community} />}
      </div>
    </footer>
  );
};

export default Index;
