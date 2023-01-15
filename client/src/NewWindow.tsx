import React, { ReactPortal, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface NewWindowProps {
    children: React.ReactNode;
}

export const NewWindow = (props: NewWindowProps): ReactPortal | null => {
    const { children } = props;
    const [ container, setContainer ] = useState<HTMLElement>();
    const newWindow = useRef<Window | null>();
  
    useEffect(() => {
        // Create container element on client-side
        const div = document.createElement('div');
        setContainer(div);
    }, []);
  
    useEffect(() => {
        // When container is ready
        if (container) {
            // Create window
            newWindow.current = window.open(
                '',
                '',
                'width=600,height=400,left=200,top=200'
            );
            // Append container
            if (newWindow.current) {
                newWindow.current.document.body.appendChild(container);
                copyStyles(window.document, newWindow.current.document);
            }
    
            // Save reference to window for cleanup
            const currWindow = newWindow.current;
    
            // Return cleanup function
            return () => {
                if (currWindow) {
                    currWindow.close();
                }
            }
        }
    }, [container]);

    const copyStyles = (src: Document, dest: Document) => {
        for (const styleSheet of Array.from(src.styleSheets)) {
            if (styleSheet.ownerNode) {
                const styleElement = styleSheet.ownerNode.cloneNode(true);
                if (styleElement instanceof HTMLAnchorElement && styleSheet.href) {
                    styleElement.href = styleSheet.href;
                }
                dest.head.appendChild(styleElement);
            }
        }
        for (const font of Array.from(src.fonts)) {
            dest.fonts.add(font);
        }
    }

    if (container) {
        return ReactDOM.createPortal(children, container);
    }
    return null;
};