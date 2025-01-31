/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { WebElementWrapper } from '@kbn/ftr-common-functional-ui-services';
import { FtrProviderContext } from '../../ftr_provider_context';

const CREATE_DRILLDOWN_DATA_TEST_SUBJ = 'embeddablePanelAction-OPEN_FLYOUT_ADD_DRILLDOWN';
const MANAGE_DRILLDOWNS_DATA_TEST_SUBJ = 'embeddablePanelAction-OPEN_FLYOUT_EDIT_DRILLDOWN';

export function DashboardDrilldownPanelActionsProvider({ getService }: FtrProviderContext) {
  const log = getService('log');
  const testSubjects = getService('testSubjects');

  return new (class DashboardDrilldownPanelActions {
    async expectExistsCreateDrilldownAction() {
      log.debug('expectExistsCreateDrilldownAction');
      await testSubjects.existOrFail(CREATE_DRILLDOWN_DATA_TEST_SUBJ);
    }

    async expectMissingCreateDrilldownAction() {
      log.debug('expectMissingCreateDrilldownAction');
      await testSubjects.existOrFail(MANAGE_DRILLDOWNS_DATA_TEST_SUBJ);
    }

    async clickCreateDrilldown() {
      log.debug('clickCreateDrilldown');
      await this.expectExistsCreateDrilldownAction();
      await testSubjects.clickWhenNotDisabledWithoutRetry(CREATE_DRILLDOWN_DATA_TEST_SUBJ);
    }

    async expectExistsManageDrilldownsAction() {
      log.debug('expectExistsCreateDrilldownAction');
      await testSubjects.existOrFail(CREATE_DRILLDOWN_DATA_TEST_SUBJ);
    }

    async expectMissingManageDrilldownsAction() {
      log.debug('expectExistsRemovePanelAction');
      await testSubjects.existOrFail(MANAGE_DRILLDOWNS_DATA_TEST_SUBJ);
    }

    async clickManageDrilldowns() {
      log.debug('clickManageDrilldowns');
      await this.expectExistsManageDrilldownsAction();
      await testSubjects.clickWhenNotDisabledWithoutRetry(MANAGE_DRILLDOWNS_DATA_TEST_SUBJ);
    }

    async expectMultipleActionsMenuOpened() {
      log.debug('exceptMultipleActionsMenuOpened');
      await testSubjects.existOrFail('multipleActionsContextMenu');
    }

    async clickActionByText(text: string) {
      log.debug(`clickActionByText: "${text}"`);
      (await this.getActionWebElementByText(text)).click();
    }

    async getActionHrefByText(text: string) {
      log.debug(`getActionHref: "${text}"`);
      const item = await this.getActionWebElementByText(text);
      return item.getAttribute('href');
    }

    async openHrefByText(text: string) {
      log.debug(`openHref: "${text}"`);
      (await this.getActionWebElementByText(text)).openHref();
    }

    async getActionWebElementByText(text: string): Promise<WebElementWrapper> {
      log.debug(`getActionWebElement: "${text}"`);
      const menu = await testSubjects.find('multipleActionsContextMenu');
      const items = await menu.findAllByCssSelector('[data-test-subj*="embeddablePanelAction-"]');
      for (const item of items) {
        const currentText = await item.getVisibleText();
        if (currentText === text) {
          return item;
        }
      }

      throw new Error(`No action matching text "${text}"`);
    }
  })();
}
