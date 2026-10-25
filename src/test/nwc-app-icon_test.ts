import {assert, fixture, fixtureCleanup} from '@open-wc/testing';
import {NWCClient, NWCAuthorizationUrlOptions} from '@getalby/sdk';
import '../components/pages/bc-alby-hub.js';
import '../components/connectors/bc-coinos-connector.js';
import store from '../state/store.js';

suite('NWC authorization app icon', () => {
  const originalFromAuthorizationUrl = NWCClient.fromAuthorizationUrl;
  const originalConfig = store.getState().bitcoinConnectConfig;
  let requests: Array<{
    url: string;
    options?: NWCAuthorizationUrlOptions;
  }>;

  setup(() => {
    requests = [];
    NWCClient.fromAuthorizationUrl = (url, options) => {
      requests.push({url, options});
      // Keep authorization pending so no wallet connection or relay is used.
      return new Promise<NWCClient>(() => {});
    };
  });

  teardown(() => {
    NWCClient.fromAuthorizationUrl = originalFromAuthorizationUrl;
    store.getState().setBitcoinConnectConfig(originalConfig);
    fixtureCleanup();
  });

  for (const {tag, button, url} of [
    {
      tag: 'bc-alby-hub',
      button: 'bci-button',
      url: 'https://my.albyhub.com/apps/new',
    },
    {
      tag: 'bc-coinos-connector',
      button: 'button',
      url: 'https://coinos.io/apps/new',
    },
  ]) {
    test(`${tag} forwards appIcon and preserves authorization options`, async () => {
      store.getState().setBitcoinConnectConfig({
        appName: 'Merchant',
        appIcon: 'https://example.com/merchant.png',
        providerConfig: {
          nwc: {
            authorizationUrlOptions: {
              requestMethods: ['get_info'],
              maxAmount: 1000,
            },
          },
        },
      });
      const element = await fixture<HTMLElement>(`<${tag}></${tag}>`);
      element.shadowRoot!.querySelector<HTMLElement>(button)!.click();

      assert.lengthOf(requests, 1);
      assert.equal(requests[0].url, url);
      assert.equal(requests[0].options?.name, 'Merchant');
      assert.equal(
        requests[0].options?.icon,
        'https://example.com/merchant.png'
      );
      assert.deepEqual(requests[0].options?.requestMethods, ['get_info']);
      assert.equal(requests[0].options?.maxAmount, 1000);
    });

    test(`${tag} supports applications without appIcon`, async () => {
      store.getState().setBitcoinConnectConfig({appName: 'Merchant'});
      const element = await fixture<HTMLElement>(`<${tag}></${tag}>`);
      element.shadowRoot!.querySelector<HTMLElement>(button)!.click();

      assert.lengthOf(requests, 1);
      assert.isUndefined(requests[0].options?.icon);
    });
  }
});
