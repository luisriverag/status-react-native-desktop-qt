/**
 * Copyright (C) 2016, Canonical Ltd.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Image
 */

'use strict';

const DeprecatedImagePropType = require('DeprecatedImagePropType');
const NativeModules = require('NativeModules');
const React = require('React');
const ReactNative = require('ReactNative'); // eslint-disable-line no-unused-vars
const StyleSheet = require('StyleSheet');

const flattenStyle = require('flattenStyle');
const requireNativeComponent = require('requireNativeComponent');
const resolveAssetSource = require('resolveAssetSource');

const ImageViewManager = NativeModules.ImageViewManager;
const ImageLoader = NativeModules.ImageLoader;

const RCTImageView = requireNativeComponent('RCTImageView');

import type {ImageStyleProp} from 'StyleSheet';
import type {ImageProps as ImagePropsType} from 'ImageProps';

function getSize(
  url: string,
  success: (width: number, height: number) => void,
  failure?: (error: any) => void,
) {
  return ImageLoader.getSize(url)
    .then(function(sizes) {
      success(sizes.width, sizes.height);
    })
    .catch(failure || function() {
      console.warn('Failed to get size for image: ' + url);
    });
}

function prefetch(url: string) {
  return ImageLoader.prefetchImage(url);
}
async function queryCache(
  urls: Array<string>,
): Promise<Map<string, 'memory' | 'disk'>> {
  return await ImageViewManager.queryCache(urls);
}

declare class ImageComponentType extends ReactNative.NativeComponent<
  ImagePropsType,
> {
  static getSize: typeof getSize;
  static prefetch: typeof prefetch;
  static queryCache: typeof queryCache;
  static resolveAssetSource: typeof resolveAssetSource;
  static propTypes: typeof DeprecatedImagePropType;
}

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * See https://facebook.github.io/react-native/docs/image.html
 */
let Image = (
  props: ImagePropsType,
  forwardedRef: ?React.Ref<'RCTImageView'>,
) => {
  const source = resolveAssetSource(props.source) || {
    uri: undefined,
    width: undefined,
    height: undefined,
  };

  let sources;
  let style: ImageStyleProp;
  if (Array.isArray(source)) {
    // $FlowFixMe flattenStyle is not strong enough
    style = flattenStyle([styles.base, props.style]) || {};
    sources = source;
  } else {
    const {width, height, uri} = source;
    // $FlowFixMe flattenStyle is not strong enough
    style = flattenStyle([{width, height}, styles.base, props.style]) || {};
    sources = [source];

    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
  }

  const resizeMode = props.resizeMode || style.resizeMode || 'cover';
  const tintColor = style.tintColor;

  if (props.src != null) {
    console.warn(
      'The <Image> component requires a `source` property rather than `src`.',
    );
  }

  if (props.children != null) {
    throw new Error(
      'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
    );
  }

  return (
    <RCTImageView
      {...props}
      ref={forwardedRef}
      style={style}
      resizeMode={resizeMode}
      tintColor={tintColor}
      source={sources}
    />
  );
};

// $FlowFixMe - TODO T29156721 `React.forwardRef` is not defined in Flow, yet.
Image = React.forwardRef(Image);

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it.
 *
 * See https://facebook.github.io/react-native/docs/image.html#getsize
 */
Image.getSize = getSize;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache.
 *
 * See https://facebook.github.io/react-native/docs/image.html#prefetch
 */
Image.prefetch = prefetch;

/**
 * Performs cache interrogation.
 *
 *  See https://facebook.github.io/react-native/docs/image.html#querycache
 */
Image.queryCache = queryCache;

/**
 * Resolves an asset reference into an object.
 *
 * See https://facebook.github.io/react-native/docs/image.html#resolveassetsource
 */
Image.resolveAssetSource = resolveAssetSource;

Image.propTypes = DeprecatedImagePropType;

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = (Image: Class<ImageComponentType>);
