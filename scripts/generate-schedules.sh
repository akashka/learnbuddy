#!/bin/bash
# Wrapper to run backend generate-schedules script
cd "$(dirname "$0")/../backend" && npm run generate-schedules
