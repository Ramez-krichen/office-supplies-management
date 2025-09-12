#!/bin/bash

echo "Office Supplies Management - Activity Generator"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH."
    echo "Please install Node.js and try again."
    exit 1
 fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the activity generator script with provided arguments
node "$SCRIPT_DIR/run-activity-generator.js" "$@"