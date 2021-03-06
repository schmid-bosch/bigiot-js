const { ApolloLink } = require('apollo-link');
const { createHttpLink } = require('apollo-link-http');
const { InMemoryCache } = require('apollo-cache-inmemory');
const url = require('url');
const apollo = require('apollo-client');
// Polyfill for fetch()
require('isomorphic-fetch');

class BigIotClient {
  constructor(market) {
    this.market = market;
  }

  authenticate() {
    const parsed = url.parse(this.market);
    parsed.pathname = '/accessToken';
    parsed.query = {
      clientId: this.id,
      clientSecret: this.secret,
    };
    return fetch(url.format(parsed))
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`Failed with ${response.statusText}`);
        }
        return response.text();
      })
      .then((token) => {
        this.client = this.getClient(token);
        return true;
      });
  }

  getClient(token) {
    const parsed = url.parse(this.market);
    parsed.pathname = '/graphql';
    const httpLink = createHttpLink({
      uri: url.format(parsed),
    });
    const middlewareLink = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          authorization: token ? `Bearer ${token}` : null,
        },
      });
      return forward(operation);
    });
    const link = middlewareLink.concat(httpLink);
    const cache = new InMemoryCache();
    return new apollo.ApolloClient({
      link,
      cache,
    });
  }
}

module.exports = BigIotClient;
