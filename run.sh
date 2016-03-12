#!/bin/bash

_now=$(date +"%s")
_server="cjwei@unix$1.andrew.cmu.edu"

sshpass -e ssh -o ConnectTimeout=10 $_server '(w -hsf)'
