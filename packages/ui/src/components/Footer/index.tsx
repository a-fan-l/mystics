'use client';

import * as React from 'react';

import Simple, { SimpleProps } from './simple';

export interface IIndexProps extends SimpleProps {
  variants?: 'simple' | 'primary' | 'secondary';
  name?: string;
}

const Index: React.FC<IIndexProps> = ({
  variants = 'simple',
  isVersion = true,
  isCommunity = true,
  name = 'simple',
  ...props
}) => {
  if (variants === 'simple') {
    return <Simple isVersion={isVersion} isCommunity={isCommunity} name={name} {...props} />;
  }
  return null;
};

export default Index;
