#! /usr/bin/env bash

ROOT_URL="http://localhost:8080" docker-compose -p medbook --x-networking -f compose-dev.yml up
