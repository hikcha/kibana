/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useMemo, useEffect } from 'react';
import { Observable } from 'rxjs';
import {
  HttpSetup,
  NotificationsStart,
  I18nStart,
  CoreTheme,
  DocLinksStart,
} from '@kbn/core/public';
import { KibanaThemeProvider } from '@kbn/react-kibana-context-theme';

import { ObjectStorageClient } from '../../../../common/types';

import * as localStorageObjectClient from '../../../lib/local_storage_object_client';
import {
  getAutocompleteInfo,
  AutocompleteInfo,
  History,
  Settings,
  Storage,
  createStorage,
  createHistory,
  createSettings,
  setStorage,
} from '../../../services';
import { createUsageTracker } from '../../../services/tracker';
import { MetricsTracker, EmbeddableConsoleDependencies } from '../../../types';

import { createApi, createEsHostService } from '../../lib';
import { EsHostService } from '../../lib/es_host_service';

import {
  ServicesContextProvider,
  EditorContextProvider,
  RequestContextProvider,
} from '../../contexts';
import { Main } from '../main';

interface ConsoleDependencies {
  I18nContext: I18nStart['Context'];
  autocompleteInfo: AutocompleteInfo;
  docLinks: DocLinksStart['links'];
  docLinkVersion: string;
  esHostService: EsHostService;
  history: History;
  http: HttpSetup;
  notifications: NotificationsStart;
  objectStorageClient: ObjectStorageClient;
  settings: Settings;
  storage: Storage;
  theme$: Observable<CoreTheme>;
  trackUiMetric: MetricsTracker;
}

const loadDependencies = ({
  core,
  usageCollection,
}: EmbeddableConsoleDependencies): ConsoleDependencies => {
  const {
    docLinks: { DOC_LINK_VERSION, links },
    http,
    i18n: { Context: I18nContext },
    notifications,
    theme: { theme$ },
  } = core;
  const trackUiMetric = createUsageTracker(usageCollection);
  trackUiMetric.load('opened_remote_app');

  const autocompleteInfo = getAutocompleteInfo();
  const storage = createStorage({
    engine: window.localStorage,
    prefix: 'sense:',
  });
  setStorage(storage);
  const history = createHistory({ storage });
  const settings = createSettings({ storage });
  const objectStorageClient = localStorageObjectClient.create(storage);
  const api = createApi({ http });
  const esHostService = createEsHostService({ api });

  autocompleteInfo.mapping.setup(http, settings);
  return {
    I18nContext,
    autocompleteInfo,
    docLinks: links,
    docLinkVersion: DOC_LINK_VERSION,
    esHostService,
    history,
    http,
    notifications,
    objectStorageClient,
    settings,
    storage,
    theme$,
    trackUiMetric,
  };
};

export const ConsoleWrapper = (props: EmbeddableConsoleDependencies): React.ReactElement => {
  const dependencies = useMemo(() => loadDependencies(props), [props]);
  useEffect(() => {
    return () => {
      dependencies.autocompleteInfo.clearSubscriptions();
    };
  }, [dependencies]);

  const {
    I18nContext,
    autocompleteInfo,
    docLinkVersion,
    docLinks,
    esHostService,
    history,
    http,
    notifications,
    objectStorageClient,
    settings,
    storage,
    theme$,
    trackUiMetric,
  } = dependencies;
  return (
    <I18nContext>
      <KibanaThemeProvider theme={{ theme$ }}>
        <ServicesContextProvider
          value={{
            docLinkVersion,
            docLinks,
            services: {
              esHostService,
              storage,
              history,
              settings,
              notifications,
              trackUiMetric,
              objectStorageClient,
              http,
              autocompleteInfo,
            },
            theme$,
          }}
        >
          <RequestContextProvider>
            <EditorContextProvider settings={settings.toJSON()}>
              <Main hideWelcome />
            </EditorContextProvider>
          </RequestContextProvider>
        </ServicesContextProvider>
      </KibanaThemeProvider>
    </I18nContext>
  );
};
