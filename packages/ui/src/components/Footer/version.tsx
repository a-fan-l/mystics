'use client';

import * as React from 'react';

export interface VersionsProps {
  version?: string;
  desc?: string;
}

const Index: React.FC<VersionsProps> = ({ version, desc }) => {
  const currentYear = new Date().getFullYear();

  return (
    <section className="version-root">
      <p className="version-text text-center text-[rgba(130,130,132,1)] md:block">
        © {currentYear} {desc} {version ? `(${version})` : ''}
      </p>
    </section>
  );
};

export default Index;
