import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpenIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const HelpDocumentation = () => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tocSections, setTocSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const contentRef = useRef(null);

  useEffect(() => {
    fetchMarkdownFile();
  }, []);

  const fetchMarkdownFile = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/admin/maintenance-guide`);
      if (!response.ok) {
        throw new Error('Failed to load maintenance guide');
      }
      const text = await response.text();
      setMarkdownContent(text);
      parseTOC(text);
      setError(null);
    } catch (err) {
      console.error('Error loading maintenance guide:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseTOC = (content) => {
    const lines = content.split('\n');
    const sections = [];
    let currentPart = null;
    let currentSection = null;

    // Parse actual headings from content (not the TOC)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip the TOC itself
      if (line.includes('## Table of Contents')) {
        // Find the end of TOC
        while (i < lines.length && !lines[i].startsWith('---')) {
          i++;
        }
        continue;
      }

      // Parse Part headers (# Part X: or ## PART X:)
      if (line.match(/^#\s+Part\s+\d+:/i) || line.match(/^##\s+PART\s+\d+:/i)) {
        if (currentPart) {
          sections.push(currentPart);
        }
        const title = line.replace(/^#+\s+/, '');
        currentPart = {
          title,
          id: generateId(title),
          items: []
        };
        currentSection = null;
      }
      // Parse APPENDICES header
      else if (line.match(/^##\s+APPENDICES/i)) {
        if (currentPart) {
          sections.push(currentPart);
        }
        const title = line.replace(/^#+\s+/, '');
        currentPart = {
          title,
          id: generateId(title),
          items: []
        };
        currentSection = null;
      }
      // Parse section headers for Parts 1-2 (## X. Title)
      else if (line.match(/^##\s+\d+\./)) {
        const title = line.replace(/^#+\s+/, '');
        currentSection = {
          title,
          id: generateId(title),
          subsections: []
        };
        if (currentPart) {
          currentPart.items.push(currentSection);
        } else {
          // Create a default part if we don't have one
          if (!currentPart) {
            currentPart = {
              title: 'Introduction',
              id: 'introduction',
              items: []
            };
          }
          currentPart.items.push(currentSection);
        }
      }
      // Parse section headers for Parts 3-8 (### **X. Title**)
      else if (line.match(/^###\s+\*\*\d+\./)) {
        const match = line.match(/^###\s+\*\*(.+?)\*\*/);
        if (match) {
          const title = match[1];
          currentSection = {
            title,
            id: generateId(title),
            subsections: []
          };
          if (currentPart) {
            currentPart.items.push(currentSection);
          }
        }
      }
      // Parse appendix sections (### **Appendix X: Title**)
      else if (line.match(/^###\s+\*\*Appendix\s+[A-Z]:/)) {
        const match = line.match(/^###\s+\*\*(.+?)\*\*/);
        if (match) {
          const title = match[1];
          currentSection = {
            title,
            id: generateId(title),
            subsections: []
          };
          if (currentPart) {
            currentPart.items.push(currentSection);
          }
        }
      }
      // Parse subsection headers for Parts 1-2 (### X.Y Title)
      else if (line.match(/^###\s+\d+\.\d+/)) {
        const title = line.replace(/^#+\s+/, '');
        if (currentSection) {
          currentSection.subsections.push({
            title,
            id: generateId(title)
          });
        }
      }
      // Parse subsection headers for Parts 3-8 (#### **X.Y Title**)
      else if (line.match(/^####\s+\*\*\d+\.\d+/)) {
        const match = line.match(/^####\s+\*\*(.+?)\*\*/);
        if (match) {
          const title = match[1];
          if (currentSection) {
            currentSection.subsections.push({
              title,
              id: generateId(title)
            });
          }
        }
      }
      // Parse CONCLUSION
      else if (line.match(/^##\s+CONCLUSION/i)) {
        const title = line.replace(/^#+\s+/, '');
        currentSection = {
          title,
          id: generateId(title),
          subsections: []
        };
        if (currentPart) {
          currentPart.items.push(currentSection);
        }
      }
    }

    if (currentPart) {
      sections.push(currentPart);
    }

    setTocSections(sections);

    // Expand all sections by default
    if (sections.length > 0) {
      const initialExpanded = {};
      sections.forEach(section => {
        initialExpanded[section.id] = true;
      });
      setExpandedSections(initialExpanded);
    }
  };

  const generateId = (text) => {
    return text
      .replace(/\*\*/g, '') // Remove markdown bold markers
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const scrollToSection = (id) => {
    console.log('Scrolling to section with id:', id);
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      console.log('Found element:', element);
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      console.log('Element not found with id:', id);
      console.log('Available heading IDs:', Array.from(document.querySelectorAll('h1[id], h2[id], h3[id], h4[id]')).map(el => el.id));
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Search functionality
  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    const lowerQuery = query.toLowerCase();
    const lines = markdownContent.split('\n');
    let currentHeading = '';
    let currentHeadingId = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track current section
      if (line.match(/^#{1,4}\s+/)) {
        currentHeading = line.replace(/^#+\s+/, '').replace(/\*\*/g, '');
        currentHeadingId = generateId(currentHeading);
      }

      // Check if line contains search query
      if (line.toLowerCase().includes(lowerQuery)) {
        // Extract context (snippet around the match)
        const matchIndex = line.toLowerCase().indexOf(lowerQuery);
        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(line.length, matchIndex + query.length + 40);
        let snippet = line.substring(start, end);

        // Add ellipsis if needed
        if (start > 0) snippet = '...' + snippet;
        if (end < line.length) snippet = snippet + '...';

        // Remove markdown formatting for display
        snippet = snippet.replace(/[#*`]/g, '');

        results.push({
          heading: currentHeading || 'Introduction',
          headingId: currentHeadingId,
          snippet: snippet,
          lineNumber: i + 1
        });
      }
    }

    setSearchResults(results);

    // Auto-expand sections containing results
    if (results.length > 0) {
      const expandedIds = {};
      tocSections.forEach(part => {
        const hasMatch = results.some(r =>
          part.items.some(item => item.id === r.headingId)
        );
        if (hasMatch) {
          expandedIds[part.id] = true;
        }
      });
      setExpandedSections(prev => ({ ...prev, ...expandedIds }));
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, markdownContent, tocSections]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Helper to extract text from React children (handles nested elements)
  const extractText = (children) => {
    if (typeof children === 'string') {
      return children;
    }
    if (Array.isArray(children)) {
      return children.map(child => extractText(child)).join('');
    }
    if (children && typeof children === 'object' && children.props && children.props.children) {
      return extractText(children.props.children);
    }
    return children ? children.toString() : '';
  };

  // Custom renderer to add IDs to headings
  const components = {
    h1: ({ node, children, ...props }) => {
      const text = extractText(children);
      const id = generateId(text);
      return <h1 id={id} className="text-3xl font-bold text-gray-900 mb-4 mt-8 pb-2 border-b-2 border-millipore-blue" {...props}>{children}</h1>;
    },
    h2: ({ node, children, ...props }) => {
      const text = extractText(children);
      const id = generateId(text);
      return <h2 id={id} className="text-2xl font-bold text-gray-900 mb-3 mt-6 pb-2 border-b border-gray-300" {...props}>{children}</h2>;
    },
    h3: ({ node, children, ...props }) => {
      const text = extractText(children);
      const id = generateId(text);
      return <h3 id={id} className="text-xl font-semibold text-gray-800 mb-2 mt-4" {...props}>{children}</h3>;
    },
    h4: ({ node, children, ...props }) => {
      const text = extractText(children);
      const id = generateId(text);
      return <h4 id={id} className="text-lg font-semibold text-gray-700 mb-2 mt-3" {...props}>{children}</h4>;
    },
    p: ({ node, children, ...props }) => (
      <p className="text-gray-700 mb-3 leading-relaxed" {...props}>{children}</p>
    ),
    ul: ({ node, children, ...props }) => (
      <ul className="list-disc list-inside mb-3 space-y-1 ml-4" {...props}>{children}</ul>
    ),
    ol: ({ node, children, ...props }) => (
      <ol className="list-decimal list-inside mb-3 space-y-1 ml-4" {...props}>{children}</ol>
    ),
    li: ({ node, children, ...props }) => (
      <li className="text-gray-700" {...props}>{children}</li>
    ),
    code: ({ node, inline, children, ...props }) => (
      inline
        ? <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
        : <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg mb-3 overflow-x-auto text-sm font-mono" {...props}>{children}</code>
    ),
    pre: ({ node, children, ...props }) => (
      <pre className="mb-3" {...props}>{children}</pre>
    ),
    blockquote: ({ node, children, ...props }) => (
      <blockquote className="border-l-4 border-millipore-blue bg-blue-50 pl-4 py-2 mb-3 italic text-gray-700" {...props}>{children}</blockquote>
    ),
    a: ({ node, children, href, ...props }) => (
      <a href={href} className="text-millipore-blue hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
    ),
    table: ({ node, children, ...props }) => (
      <div className="overflow-x-auto mb-3">
        <table className="min-w-full divide-y divide-gray-200 border" {...props}>{children}</table>
      </div>
    ),
    thead: ({ node, children, ...props }) => (
      <thead className="bg-gray-50" {...props}>{children}</thead>
    ),
    tbody: ({ node, children, ...props }) => (
      <tbody className="bg-white divide-y divide-gray-200" {...props}>{children}</tbody>
    ),
    tr: ({ node, children, ...props }) => (
      <tr {...props}>{children}</tr>
    ),
    th: ({ node, children, ...props }) => (
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>{children}</th>
    ),
    td: ({ node, children, ...props }) => (
      <td className="px-4 py-2 text-sm text-gray-700" {...props}>{children}</td>
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-millipore-blue mx-auto mb-4"></div>
          <p className="text-gray-500">Loading maintenance guide...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Failed to Load Documentation</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchMarkdownFile}
              className="mt-3 btn btn-secondary text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Navigation Sidebar */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto sticky top-0 h-screen">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-millipore-blue to-blue-600">
          <div className="flex items-center text-white">
            <BookOpenIcon className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-semibold">Documentation</h2>
          </div>
          <p className="text-blue-100 text-xs mt-1">Navigation</p>
        </div>

        {/* Search Box */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-millipore-blue focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Search Results Summary */}
          {searchQuery && (
            <div className="mt-2 text-xs text-gray-600">
              {searchResults.length > 0 ? (
                <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
              ) : (
                <span className="text-amber-600">No results found</span>
              )}
            </div>
          )}
        </div>

        {/* Search Results or Navigation */}
        <nav className="p-4">
          {searchQuery && searchResults.length > 0 ? (
            // Show search results
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Search Results
              </h3>
              {searchResults.slice(0, 50).map((result, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSection(result.headingId)}
                  className="block w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="text-xs font-medium text-millipore-blue mb-1">
                    {result.heading}
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2">
                    {result.snippet}
                  </div>
                </button>
              ))}
              {searchResults.length > 50 && (
                <p className="text-xs text-gray-500 italic mt-2">
                  Showing first 50 of {searchResults.length} results
                </p>
              )}
            </div>
          ) : !searchQuery ? (
            // Show normal table of contents when not searching
            <>
              {tocSections.map((part) => (
                <div key={part.id} className="mb-4">
                  <button
                    onClick={() => toggleSection(part.id)}
                    className="flex items-center justify-between w-full text-left font-semibold text-gray-900 hover:text-millipore-blue mb-2 transition-colors"
                  >
                    <span className="text-sm">{part.title}</span>
                    {expandedSections[part.id] ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>

                  {expandedSections[part.id] && (
                    <div className="ml-2 space-y-1">
                      {part.items.map((section) => (
                        <div key={section.id}>
                          <button
                            onClick={() => scrollToSection(section.id)}
                            className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${
                              activeSection === section.id
                                ? 'bg-millipore-blue text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {section.title}
                          </button>
                          {section.subsections && section.subsections.length > 0 && (
                            <div className="ml-3 mt-1 space-y-0.5">
                              {section.subsections.map((subsection) => (
                                <button
                                  key={subsection.id}
                                  onClick={() => scrollToSection(subsection.id)}
                                  className={`block w-full text-left text-xs py-1 px-2 rounded transition-colors ${
                                    activeSection === subsection.id
                                      ? 'bg-blue-100 text-millipore-blue font-medium'
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {subsection.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : null}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Disclaimer Section */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-900 font-bold text-lg mb-2">Important Notice</h3>
                <p className="text-amber-800 text-sm leading-relaxed mb-2">
                  This Maintenance Guide is a <strong>comprehensive technical reference document</strong> designed
                  to help developers and maintainers understand, modify, and troubleshoot the NPDI Portal application.
                </p>
                <p className="text-amber-800 text-sm leading-relaxed">
                  <strong>Purpose:</strong> This guide serves as living documentation for the system architecture,
                  codebase structure, common maintenance tasks, and troubleshooting procedures. It is intended for
                  technical staff who need to work with the application code or infrastructure.
                </p>
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-amber-700 text-xs">
                    <strong>Note:</strong> This is not an end-user manual. For help using the NPDI Portal as a
                    Product Manager or PM Ops user, please refer to the user training materials or contact your
                    system administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Markdown Content */}
          <div ref={contentRef} className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDocumentation;
