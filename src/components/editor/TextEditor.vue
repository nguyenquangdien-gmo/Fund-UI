<template>
    <div class="text-editor-container">
        <div class="editor-container editor-container_classic-editor" ref="editorContainerElement">
            <div class="editor-container__editor">
                <div ref="editorElement">
                    <ckeditor v-if="editor && config" :modelValue="typeof config.initialData === 'string' ? config.initialData : ''" :editor="editor" :config="config" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

// Types
import type { EditorConfig } from '@ckeditor/ckeditor5-core';

// CKEditor imports
import {
	ClassicEditor,
	Alignment,
	AutoLink,
	Autosave,
	BalloonToolbar,
	BlockQuote,
	Bold,
	Bookmark,
	Code,
	CodeBlock,
	Essentials,
	FontBackgroundColor,
	FontColor,
	FontFamily,
	FontSize,
	GeneralHtmlSupport,
	Heading,
	Highlight,
	HorizontalLine,
	HtmlComment,
	HtmlEmbed,
	ImageEditing,
	ImageUtils,
	Indent,
	IndentBlock,
	Italic,
	Link,
	List,
	ListProperties,
	Paragraph,
	RemoveFormat,
	ShowBlocks,
	Strikethrough,
	Subscript,
	Superscript,
	TodoList,
	Underline
} from 'ckeditor5';

import translations from 'ckeditor5/translations/vi.js';
import 'ckeditor5/ckeditor5.css';

// Constants
const LICENSE_KEY = 'GPL';

const isLayoutReady = ref<boolean>(false);
const editor = ClassicEditor;

const config = computed<EditorConfig | null>(() => {
	if (!isLayoutReady.value) {
		return null;
	}

	return {
		toolbar: {
			items: [
				'showBlocks',
				'|',
				'heading',
				'|',
				'fontSize',
				'fontFamily',
				'fontColor',
				'fontBackgroundColor',
				'|',
				'bold',
				'italic',
				'underline',
				'strikethrough',
				'subscript',
				'superscript',
				'code',
				'removeFormat',
				'|',
				'horizontalLine',
				'link',
				'bookmark',
				'highlight',
				'blockQuote',
				'codeBlock',
				'htmlEmbed',
				'|',
				'alignment',
				'|',
				'bulletedList',
				'numberedList',
				'todoList',
				'outdent',
				'indent'
			],
			shouldNotGroupWhenFull: false
		},
		plugins: [
			Alignment,
			AutoLink,
			Autosave,
			BalloonToolbar,
			BlockQuote,
			Bold,
			Bookmark,
			Code,
			CodeBlock,
			Essentials,
			FontBackgroundColor,
			FontColor,
			FontFamily,
			FontSize,
			GeneralHtmlSupport,
			Heading,
			Highlight,
			HorizontalLine,
			HtmlComment,
			HtmlEmbed,
			ImageEditing,
			ImageUtils,
			Indent,
			IndentBlock,
			Italic,
			Link,
			List,
			ListProperties,
			Paragraph,
			RemoveFormat,
			ShowBlocks,
			Strikethrough,
			Subscript,
			Superscript,
			TodoList,
			Underline
		],
		balloonToolbar: ['bold', 'italic', '|', 'link', '|', 'bulletedList', 'numberedList'],
		fontFamily: {
			supportAllValues: true
		},
		fontSize: {
			options: [10, 12, 14, 'default', 18, 20, 22],
			supportAllValues: true
		},
		heading: {
			options: [
				{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
				{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
				{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
				{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
				{ model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
				{ model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
				{ model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
			]
		},
		htmlSupport: {
			allow: [{ name: /^.*$/, styles: true, attributes: true, classes: true }]
		},
		initialData: '<h2>Congratulations on setting up CKEditor 5! 🎉</h2><p>...</p>',
		language: 'vi',
		licenseKey: LICENSE_KEY,
		link: {
			addTargetToExternalLinks: true,
			defaultProtocol: 'https://',
			decorators: {
				toggleDownloadable: {
					mode: 'manual',
					label: 'Downloadable',
					attributes: {
						download: 'file'
					}
				}
			}
		},
		list: {
			properties: {
				styles: true,
				startIndex: true,
				reversed: true
			}
		},
		placeholder: 'Type or paste your content here!',
		translations: [translations]
	};
});

onMounted(() => {
	isLayoutReady.value = true;
});
</script>
