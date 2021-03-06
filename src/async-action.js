import _ from 'lodash';
import { getOrCreateAsyncConstants } from './async-constants';
import { REDUX_EASY_ASYNC_NAMESPACE, ERRORS } from './lib/constants';
import { createAction } from './action';

const decorateActionCreator = (actionCreator, asyncConstants) => {
  const { START_TYPE, SUCCESS_TYPE, FAIL_TYPE, NAME } = asyncConstants;
  _.assign(actionCreator, {
    START_TYPE,
    SUCCESS_TYPE,
    FAIL_TYPE,
    NAME,
    start: createAction(START_TYPE),
    success: createAction(SUCCESS_TYPE),
    fail: createAction(FAIL_TYPE),
    actionName: NAME,
  });
};

/**
 *
 * @kind function
 * @param  {(string|object)} type - can either be a string (e.g. "GET_POSTS") or a
 * a constants object created with {@link createAsyncConstants}.
 * @param  {Function} fn - action creator function that returns an object with action configuration.
 * See example below for configuration options. Only `makeRequest is required`.
 * @param  {Object}   [options] additional configuration options
 * @param  {Object}   [options.namespace=REDUX_EASY_ASYNC_NAMESPACE] the middleware action
 * type this action will be dispatched with. You most likely don't want to modify this unless for
 * some reason you want multiple instances of [async middleware]{@link createAsyncMiddleware}.
 * @return {function} actionCreator
 * @example <caption>All configuration options for async action</caption>
 * import { createAsyncAction } from 'redux-easy-async';
 *
 * const myAction = createAsyncAction('MY_ACTION', () => {
 *   return {
 *     // function that makes the actual request. Return value must be a promise. In this example
 *     // `fetch()` returns a promise. **REQUIRED**
 *     makeRequest: () => fetch('/api/posts'),
 *
 *     // *OPTIONAL*
 *     // additional meta that will be passed to the start, success, and fail actions if any. All
 *     // actions will have the following meta:
 *     //   - `actionName`
 *     //   - `asyncType`("start", "success", or "fail")
 *     //   - `requestStartTime`
 *     //   - `asyncID`: an unique id for each request
 *     // Success and fail actions will additionally have:
 *     //   - `requestDuration`
 *     //   - `resp`: the raw api response. Because of the nature of the promises errors that
 *     //     cause the makeRequest promise to be rejected will also get caught here as `resp`
 *     //     and cause a failed request action.
 *     meta: {},
 *
 *     // function that takes your redux state and returns true or false whether to proceed with
 *     // the request. For example: checking if there is already a similar request in progress or
 *     // the requested data is already cached. *OPTIONAL*
 *     shouldMakeRequest: (state) => true,
 *
 *     // `parseStart`, `parseSuccess`, and `parseFail` can be useful if you want to modify
 *     // raw API responses, errors, etc. before passing them to your reducer. The return value
 *     // of each becomes the payload for start, success, and fail actions. By default response
 *     // will not be modified.
 *     //
 *     // the return value of `parseStart` becomes the payload for the start action. *OPTIONAL*
 *     parseStart: () => null,
 *     // the return value of `parseSuccess` becomes the payload for the success action. *OPTIONAL*
 *     parseSuccess: resp => resp,
 *     // the return value of `parseFail` becomes the payload for the fail action. *OPTIONAL*
 *     parseFail: resp => resp,
 *   }
 *
 * })
 */
export const createAsyncAction = (type, fn, options = {}) => {
  const {
    namespace = REDUX_EASY_ASYNC_NAMESPACE,
  } = options;

  const asyncConstants = getOrCreateAsyncConstants(type);
  if (!asyncConstants) {
    throw new Error(`createAsyncAction(type, fn, options): ${ERRORS.ASYNC_TYPE_NOT_VALID}`);
  }

  const actionCreator = (...args) => {
    const action = fn(...args);
    if (typeof action !== 'object') {
      throw new Error(ERRORS.ACTION_NOT_OBJECT);
    }
    if (typeof action.makeRequest !== 'function') {
      throw new Error(ERRORS.MAKE_REQUEST_NOT_FUNCTION);
    }
    return {
      type: namespace,
      ...action,
      actionCreatorArgs: args,
      actionName: actionCreator.actionName,
      startActionCreator: actionCreator.start,
      successActionCreator: actionCreator.success,
      failActionCreator: actionCreator.fail,
    };
  };
  // attach the name and start, success, and fail actions for convenience
  decorateActionCreator(actionCreator, asyncConstants);
  return actionCreator;
};
