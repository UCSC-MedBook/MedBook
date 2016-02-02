#! /usr/bin/env bash

ROOT_URL="http://0.0.0.0:8000" docker-compose -p medbook --x-networking -f compose-dev.yml up
