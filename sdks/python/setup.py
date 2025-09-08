from setuptools import setup, find_packages

setup(
    name='git-memory-mcp-sdk',
    version='1.0.0',
    description='Python SDK for the Git Memory MCP Server',
    author='Git Memory MCP Server',
    packages=find_packages(),
    install_requires=['requests'],
)