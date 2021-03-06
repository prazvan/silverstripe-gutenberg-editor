import { __, sprintf } from '@wordpress/i18n';
import * as heading from '@wordpress/blocks/library/heading';
import { isBlockFeatureEnabled } from '../../config';

import {
    BlockControls,
    InspectorControls,
    AlignmentToolbar,
} from '@wordpress/blocks';

import { PanelBody, Toolbar } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks/api';

import { RichText } from '../../components';

import { isUndefined } from 'lodash';

export const name = 'core/heading';

const transforms = heading.settings.transforms;

transforms.to.push({
    type: 'block',
    blocks: [ 'madehq/lede-copy' ],
    transform: ( { content } ) => {
        return createBlock( 'madehq/lede-copy', {
            content,
        } );
    },
});

export const settings = {
    ...heading.settings,

    transforms,

    edit( { attributes, setAttributes, isSelected, mergeBlocks, insertBlocksAfter, onReplace, className, onFocus, allowNodeChange, onSplit } ) {
        const {
            align,
            content,
            nodeName,
            placeholder,
        } = attributes;

        const textAlignmentEnabled = isBlockFeatureEnabled(name, 'textAlignment');

        if (isUndefined(allowNodeChange)) {
            allowNodeChange = true;
        }

        if (isUndefined(onSplit)) {
            onSplit = !insertBlocksAfter ? undefined : ( before, after, ...blocks ) => {
                setAttributes( { content: before } );

                insertBlocksAfter( [
                    ...blocks,
                    createBlock( 'core/paragraph', { content: after } ),
                ] );
            };
        }

        return [
            isSelected && allowNodeChange && (
                <BlockControls
                    key="controls"
                    controls={
                        '234'.split( '' ).map( ( level ) => ( {
                            icon: 'heading',
                            title: sprintf( __( 'Heading %s' ), level ),
                            isActive: 'H' + level === nodeName,
                            onClick: () => setAttributes( { nodeName: 'H' + level } ),
                            subscript: level,
                        } ) )
                    }
                />
            ),
            isSelected && (
                <InspectorControls key="inspector">
                    { allowNodeChange && (
                        <div>
                            <h3>{ __( 'Heading Settings' ) }</h3>

                            <p>{ __( 'Level' ) }</p>

                            <Toolbar
                                controls={
                                    '23456'.split( '' ).map( ( level ) => ( {
                                        icon: 'heading',
                                        title: sprintf( __( 'Heading %s' ), level ),
                                        isActive: 'H' + level === nodeName,
                                        onClick: () => setAttributes( { nodeName: 'H' + level } ),
                                        subscript: level,
                                    } ) )
                                }
                            />
                        </div>
                    ) }

                    { textAlignmentEnabled && (
                        <PanelBody title={ __( 'Text Alignment' ) }>
                            <AlignmentToolbar
                                value={ align }
                                onChange={ ( nextAlign ) => {
                                    setAttributes( { align: nextAlign } );
                                } }
                            />
                        </PanelBody>
                    )}
                </InspectorControls>
            ),
            <RichText
                key="editable"
                wrapperClassName="wp-block-heading"
                tagName={ nodeName.toLowerCase() }
                value={ content }
                onChange={ ( value ) => setAttributes( { content: value } ) }
                onMerge={ mergeBlocks }
                onSplit={ onSplit }
                onRemove={ () => onReplace( [] ) }
                style={ { textAlign: align } }
                className={ className }
                placeholder={ placeholder || __( 'Write heading…' ) }
                isSelected={ isSelected }
                onFocus={ onFocus }
                keepPlaceholderOnFocus={ true }
                multiline={ false }
            />,
        ];
    },

    supports: {
        className: isBlockFeatureEnabled(name, 'className'),
        anchor: isBlockFeatureEnabled(name, 'anchor'),
    },
}
