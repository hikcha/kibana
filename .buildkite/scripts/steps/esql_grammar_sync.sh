#!/bin/bash

synchronize_lexer_grammar () {
  license_header="$1"
  source_file="$PARENT_DIR/elasticsearch/x-pack/plugin/esql/src/main/antlr/EsqlBaseLexer.g4"
  destination_file="./packages/kbn-monaco/src/esql/antlr/esql_lexer.g4"

  # Copy the file
  cp "$source_file" "$destination_file" || exit

  # Insert the license header
  temp_file=$(mktemp)
  printf "%s\n\n// DO NOT MODIFY THIS FILE BY HAND. IT IS MANAGED BY A CI JOB.\n\n%s" "$license_header" "$(cat $destination_file)" > "$temp_file"
  mv "$temp_file" "$destination_file"

  # Replace the line containing "lexer grammar" with "lexer grammar esql_lexer;"
  sed -i -e 's/lexer grammar.*$/lexer grammar esql_lexer;/' "$destination_file" || exit

  # Insert "options { caseInsensitive = true; }" one line below
  sed -i -e '/lexer grammar esql_lexer;/a\
  options { caseInsensitive = true; }' "$destination_file" || exit

  echo "File copied and modified successfully."
}

synchronize_parser_grammar () {
  license_header="$1"
  source_file="$PARENT_DIR/elasticsearch/x-pack/plugin/esql/src/main/antlr/EsqlBaseParser.g4"
  destination_file="./packages/kbn-monaco/src/esql/antlr/esql_parser.g4"

  # Copy the file
  cp "$source_file" "$destination_file" || exit

  # Insert the license header
  temp_file=$(mktemp)
  printf "%s\n\n// DO NOT MODIFY THIS FILE BY HAND. IT IS MANAGED BY A CI JOB.\n\n%s" "$license_header" "$(cat ${destination_file})" > "$temp_file"
  mv "$temp_file" "$destination_file"

  # Replace the line containing "parser grammar" with "parser grammar esql_parser;"
  sed -i -e 's/parser grammar.*$/parser grammar esql_parser;/' "$destination_file" || exit

  # Replace options {tokenVocab=EsqlBaseLexer;} with options {tokenVocab=esql_lexer;}
  sed -i -e 's/options {tokenVocab=EsqlBaseLexer;}/options {tokenVocab=esql_lexer;}/' "$destination_file" || exit

  echo "File copied and modified successfully."
}

report_main_step () {
  echo ""
  echo "-------------------------------------------------"
  echo "MAIN STEP: $1"
  echo "-------------------------------------------------"
}

main () {
  cd "$PARENT_DIR" || exit

  report_main_step "Cloning repositories"

  rm -rf elasticsearch
  git clone https://github.com/elastic/elasticsearch --depth 1 || exit

  rm -rf open-source
  git clone https://github.com/elastic/open-source --depth 1 || exit

  cd "$KIBANA_DIR" || exit

  license_header=$(cat "$PARENT_DIR/open-source/legal/elastic-license-2.0-header.txt")

  report_main_step "Synchronizing lexer grammar..."
  synchronize_lexer_grammar "$license_header"

  report_main_step "Synchronizing parser grammar..."
  synchronize_parser_grammar "$license_header"

  # Check for differences
  git diff --exit-code --quiet "$destination_file"

  if [ $? -eq 0 ]; then
    echo "No differences found. Our work is done here."
    exit
  fi

  report_main_step "Differences found. Checking for an existing pull request."

  KIBANA_MACHINE_USERNAME="kibanamachine"
  git config --global user.name "$KIBANA_MACHINE_USERNAME"
  git config --global user.email '42973632+kibanamachine@users.noreply.github.com'

  PR_TITLE='[ES|QL] Update lexer grammar'
  PR_BODY='This PR updates the ES|QL lexer grammar to match the latest version in Elasticsearch.'

  # Check if a PR already exists
  pr_search_result=$(gh pr list --search "$PR_TITLE" --state open --author "$KIBANA_MACHINE_USERNAME"  --limit 1 --json title -q ".[].title")

  if [ "$pr_search_result" == "$PR_TITLE" ]; then
    echo "PR already exists. Exiting."
    exit
  fi

  report_main_step "No existing PR found. Building ANTLR artifacts."

  # Bootstrap Kibana
  yarn kbn bootstrap || exit

  # Build ANTLR stuff
  cd ./packages/kbn-monaco/src || exit 
  yarn build:antlr4:esql || exit

  # Make a commit
  BRANCH_NAME="esql_grammar_sync_$(date +%s)"

  git checkout -b "$BRANCH_NAME"

  git add -A
  git commit -m "Update ES|QL grammars"

  report_main_step "Changes committed. Creating pull request."

  git push --set-upstream origin "$BRANCH_NAME"

  # Create a PR
  gh pr create --draft --title '[ES|QL] Update lexer grammar' --body 'This PR updates the ES|QL lexer grammar to match the latest version in Elasticsearch.' --base main --head "$BRANCH_NAME" --label 'release_note:skip' || exit
}

main
