/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useState, useCallback } from 'react';
import { isEmpty } from 'lodash';
import { loadRules } from '@kbn/triggers-actions-ui-plugin/public';
import { RULES_LOAD_ERROR } from '../pages/rules/translations';
import { FetchRulesProps, RuleState } from '../pages/rules/types';
import { OBSERVABILITY_RULE_TYPES } from '../pages/rules/config';
import { useKibana } from '../utils/kibana_react';

export function useFetchRules({
  searchText,
  ruleLastResponseFilter,
  ruleStatusesFilter,
  typesFilter,
  setPage,
  page,
  sort,
}: FetchRulesProps) {
  const { http } = useKibana().services;

  const [rulesState, setRulesState] = useState<RuleState>({
    isLoading: false,
    data: [],
    error: null,
    totalItemCount: 0,
  });

  const [noData, setNoData] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const fetchRules = useCallback(async () => {
    setRulesState((oldState) => ({ ...oldState, isLoading: true }));

    try {
      const response = await loadRules({
        http,
        page,
        searchText,
        typesFilter: typesFilter.length > 0 ? typesFilter : OBSERVABILITY_RULE_TYPES,
        ruleExecutionStatusesFilter: ruleLastResponseFilter,
        ruleStatusesFilter,
        sort,
      });
      setRulesState((oldState) => ({
        ...oldState,
        isLoading: false,
        data: response.data,
        totalItemCount: response.total,
      }));

      if (!response.data?.length && page.index > 0) {
        setPage({ ...page, index: 0 });
      }
      const isFilterApplied = !(
        isEmpty(searchText) &&
        isEmpty(ruleLastResponseFilter) &&
        isEmpty(ruleStatusesFilter) &&
        isEmpty(typesFilter)
      );

      setNoData(response.data.length === 0 && !isFilterApplied);
    } catch (_e) {
      setRulesState((oldState) => ({ ...oldState, isLoading: false, error: RULES_LOAD_ERROR }));
    }
    setInitialLoad(false);
  }, [
    http,
    page,
    setPage,
    searchText,
    ruleLastResponseFilter,
    ruleStatusesFilter,
    typesFilter,
    sort,
  ]);
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rulesState,
    reload: fetchRules,
    setRulesState,
    noData,
    initialLoad,
  };
}
