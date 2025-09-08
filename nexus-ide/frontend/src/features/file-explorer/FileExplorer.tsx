import React, { useState, useEffect } from "react";
import { Tree, NodeApi } from "react-arborist";
import { VscQuestion, VscDiffModified, VscDiffAdded, VscDiffRemoved, VscDiffRenamed } from 'react-icons/vsc';
import { useQuery } from '@tanstack/react-query';
import { FaSearch } from 'react-icons/fa';

const fetchFileTree = async () => {
  const response = await fetch('/api/files');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

const FileExplorer = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['fileTree'],
    queryFn: fetchFileTree,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const [gitStatus, setGitStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchGitStatus = async () => {
      try {
        const response = await fetch('/api/git/status');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        // Convert array of git status to a hash map for faster lookup
        const statusMap = data.files.reduce((acc, file) => {
          acc[file.path] = file.working_dir;
          return acc;
        }, {});
        setGitStatus(statusMap);
      } catch (error) {
        console.error("Failed to fetch git status:", error);
      }
    };

    fetchFileTree();
    fetchGitStatus();
  }, []);

  const getFileStatus = (fileName: string) => {
    return gitStatus[fileName] || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "untracked":
        return "#34D399"; // Green-400
      case "modified":
        return "#FBBF24"; // Amber-400
      case "deleted":
        return "#F87171"; // Red-400
      case "renamed":
        return "#60A5FA"; // Blue-400
      default:
        return "inherit";
    }
  };

  const getStatusTitle = (status: string, fileName: string) => {
    switch (status) {
      case "untracked":
        return `${fileName} - Untracked`;
      case "modified":
        return `${fileName} - Modified`;
      case "deleted":
        return `${fileName} - Deleted`;
      case "renamed":
        return `${fileName} - Renamed`;
      default:
        return fileName;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'M':
        return <VscDiffModified className="inline -mb-0.5 ml-2" />;
      case 'A':
      case '?':
        return <VscDiffAdded className="inline -mb-0.5 ml-2" />;
      case 'D':
        return <VscDiffRemoved className="inline -mb-0.5 ml-2" />;
      case 'R':
        return <VscDiffRenamed className="inline -mb-0.5 ml-2" />;
      default:
        return null;
    }
  };

  const renderTitle = (node: NodeApi) => {
    const status = getFileStatus(node.data.name);
    const color = getStatusColor(status);
    const title = getStatusTitle(status, node.data.name);
    const icon = getStatusIcon(status);

    return (
      <span style={{ color }} title={title}>
        {node.data.name}
        {icon}
      </span>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error fetching file tree.</div>;
  }

  const filterTree = (nodes, term) => {
    if (!nodes) return [];
    if (!term) return nodes;

    return nodes.reduce((acc, node) => {
      // If the node's title matches, add the node and all its children.
      if (node.title.toLowerCase().includes(term.toLowerCase())) {
        acc.push(node);
        return acc;
      }

      // If the node's title does not match, check its children.
      if (node.children) {
        const filteredChildren = filterTree(node.children, term);
        if (filteredChildren.length > 0) {
          // If there are matching children, add the node with only the filtered children.
          acc.push({ ...node, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  };

  const filteredData = filterTree(data, searchTerm);

  return (
    <div className="p-4 bg-gray-800 text-white h-full">
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <FaSearch className="text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Tree
        initialData={filteredData}
        width={300}
        height={1000}
      >
        {renderTitle}
      </Tree>
    </div>
  );
};

export default FileExplorer;