#!/bin/bash
# Wrapper to run backend clear-schedules script
cd "$(dirname "$0")/../backend" && npm run clear-schedules
