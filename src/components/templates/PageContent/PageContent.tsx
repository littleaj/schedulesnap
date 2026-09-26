import React from "react";
import './PageContent.css';

interface PageContentProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const PageContent = ({ children, className, ...rest }: PageContentProps) => {
  return (
    <main className={className ? `page ${className}` : 'page'} {...rest}>
      {children}
    </main>
  );
};

export default PageContent;
