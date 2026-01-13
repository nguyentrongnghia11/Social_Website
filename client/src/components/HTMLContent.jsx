"use client"

import { Box } from "@mui/material"
import DOMPurify from "dompurify"



const HTMLContent = ({ content, maxHeight = null, className = "content" }) => {
    const sanitizeHTML = (html) => {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "p",
                "br",
                "strong",
                "em",
                "u",
                "s",
                "ul",
                "ol",
                "li",
                "blockquote",
                "code",
                "pre",
                "a",
                "img",
                "span",
                "div",
            ],
            ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class", "style"],
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        })
    }

    return (
        <Box
            maxHeight={maxHeight}
            overflow="hidden"
            className={className}
            sx={{
                // Typography styles
                "& h1, & h2, & h3, & h4, & h5, & h6": {
                    fontWeight: "bold",
                    marginTop: 2,
                    marginBottom: 1,
                    color: "text.primary",
                    lineHeight: 1.3,
                },
                "& h1": { fontSize: "2rem" },
                "& h2": { fontSize: "1.5rem" },
                "& h3": { fontSize: "1.25rem" },
                "& h4": { fontSize: "1.125rem" },
                "& h5": { fontSize: "1rem" },
                "& h6": { fontSize: "0.875rem" },

                // Paragraph styles
                "& p": {
                    marginBottom: 1,
                    lineHeight: 1.6,
                    color: "text.primary",
                    "&:last-child": {
                        marginBottom: 0,
                    },
                },

                // List styles
                "& ul, & ol": {
                    paddingLeft: 2,
                    marginBottom: 1,
                    marginTop: 0.5,
                },
                "& li": {
                    marginBottom: 0.5,
                    lineHeight: 1.5,
                },
                "& ul": {
                    listStyleType: "disc",
                },
                "& ol": {
                    listStyleType: "decimal",
                },

                // Blockquote styles
                "& blockquote": {
                    borderLeft: "4px solid #1976d2",
                    paddingLeft: 2,
                    paddingRight: 1,
                    paddingTop: 1,
                    paddingBottom: 1,
                    margin: "1rem 0",
                    fontStyle: "italic",
                    backgroundColor: "rgba(25, 118, 210, 0.04)",
                    borderRadius: 1,
                    "& p": {
                        marginBottom: 0.5,
                    },
                },

                // Code styles
                "& code": {
                    backgroundColor: "#f5f5f5",
                    padding: "2px 6px",
                    borderRadius: 1,
                    fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                    fontSize: "0.875rem",
                    color: "#d63384",
                    border: "1px solid #e9ecef",
                },
                "& pre": {
                    backgroundColor: "#f8f9fa",
                    padding: 2,
                    borderRadius: 1,
                    overflow: "auto",
                    border: "1px solid #e9ecef",
                    marginTop: 1,
                    marginBottom: 1,
                    "& code": {
                        backgroundColor: "transparent",
                        padding: 0,
                        color: "inherit",
                        border: "none",
                    },
                },

                // Link styles
                "& a": {
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": {
                        textDecoration: "underline",
                    },
                    "&:visited": {
                        color: "primary.dark",
                    },
                },

                // Image styles
                "& img": {
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: 1,
                    marginTop: 1,
                    marginBottom: 1,
                    display: "block",
                },

                // Text formatting
                "& strong": {
                    fontWeight: 600,
                },
                "& em": {
                    fontStyle: "italic",
                },
                "& u": {
                    textDecoration: "underline",
                },
                "& s": {
                    textDecoration: "line-through",
                },

                // Spacing adjustments
                "& > *:first-of-type": {
                    marginTop: 0,
                },
                "& > *:last-child": {
                    marginBottom: 0,
                },

                // Table styles (if needed)
                "& table": {
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: 1,
                    marginBottom: 1,
                },
                "& th, & td": {
                    border: "1px solid #e0e0e0",
                    padding: 1,
                    textAlign: "left",
                },
                "& th": {
                    backgroundColor: "#f5f5f5",
                    fontWeight: 600,
                },

                // Responsive adjustments
                "@media (max-width: 600px)": {
                    "& h1": { fontSize: "1.75rem" },
                    "& h2": { fontSize: "1.375rem" },
                    "& h3": { fontSize: "1.125rem" },
                    "& pre": {
                        fontSize: "0.8rem",
                        padding: 1,
                    },
                },
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
        />
    )
}

export default HTMLContent
