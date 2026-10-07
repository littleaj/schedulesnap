import React from "react";
import "./NoteBlock.css";

interface NoteBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'information' | 'warning' | 'error' | 'success';
}

const NoteBlock = ({ children, className, variant, ...rest}: NoteBlockProps) => {
  return (
    <div className={`note-block ${variant ?? ''} ${className ?? ''}`} {...rest}>
      {children}
    </div>
  )
}

export default NoteBlock;
