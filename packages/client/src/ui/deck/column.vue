<template>
<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
<section v-hotkey="keymap" class="dnpfarvg _panel _narrow_"
	:class="{ paged: isMainColumn, naked, active, isStacked, draghover, dragging, dropready }"
	:style="{ '--deckColumnHeaderHeight': deckStore.reactiveState.columnHeaderHeight.value + 'px' }"
	@dragover.prevent.stop="onDragover"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
>
	<header :class="{ indicated }"
		draggable="true"
		@click="goTop"
		@dragstart="onDragstart"
		@dragend="onDragend"
		@contextmenu.prevent.stop="onContextmenu"
	>
		<button v-if="isStacked && !isMainColumn" class="toggleActive _button" @click="toggleActive">
			<template v-if="active"><i class="fas fa-angle-up"></i></template>
			<template v-else><i class="fas fa-angle-down"></i></template>
		</button>
		<div class="action">
			<slot name="action"></slot>
		</div>
		<span class="header"><slot name="header"></slot></span>
		<button v-if="func" v-tooltip="func.title" class="menu _button" @click.stop="func.handler"><i :class="func.icon || 'fas fa-cog'"></i></button>
	</header>
	<div v-show="active" ref="body">
		<slot></slot>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';
import { updateColumn, swapLeftColumn, swapRightColumn, swapUpColumn, swapDownColumn, stackLeftColumn, popRightColumn, removeColumn, swapColumn } from './deck-store';
import { deckStore } from './deck-store';

export default defineComponent({
	provide: {
		shouldHeaderThin: true,
		shouldOmitHeaderTitle: true,
	},

	props: {
		column: {
			type: Object,
			required: false,
			default: null
		},
		isStacked: {
			type: Boolean,
			required: false,
			default: false
		},
		func: {
			type: Object,
			required: false,
			default: null
		},
		naked: {
			type: Boolean,
			required: false,
			default: false
		},
		indicated: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	data() {
		return {
			deckStore,
			dragging: false,
			draghover: false,
			dropready: false,
		};
	},

	computed: {
		isMainColumn(): boolean {
			return this.column.type === 'main';
		},

		active(): boolean {
			return this.column.active !== false;
		},

		keymap(): any {
			return {
				'shift+up': () => this.$parent.$emit('parent-focus', 'up'),
				'shift+down': () => this.$parent.$emit('parent-focus', 'down'),
				'shift+left': () => this.$parent.$emit('parent-focus', 'left'),
				'shift+right': () => this.$parent.$emit('parent-focus', 'right'),
			};
		}
	},

	watch: {
		active(v) {
			this.$emit('change-active-state', v);
		},

		dragging(v) {
			os.deckGlobalEvents.emit(v ? 'column.dragStart' : 'column.dragEnd');
		}
	},

	mounted() {
		os.deckGlobalEvents.on('column.dragStart', this.onOtherDragStart);
		os.deckGlobalEvents.on('column.dragEnd', this.onOtherDragEnd);
	},

	beforeUnmount() {
		os.deckGlobalEvents.off('column.dragStart', this.onOtherDragStart);
		os.deckGlobalEvents.off('column.dragEnd', this.onOtherDragEnd);
	},

	methods: {
		onOtherDragStart() {
			this.dropready = true;
		},

		onOtherDragEnd() {
			this.dropready = false;
		},

		toggleActive() {
			if (!this.isStacked) return;
			updateColumn(this.column.id, {
				active: !this.column.active
			});
		},

		getMenu() {
			const items = [{
				icon: 'fas fa-pencil-alt',
				text: this.$ts.edit,
				action: async () => {
					const { canceled, result } = await os.form(this.column.name, {
						name: {
							type: 'string',
							label: this.$ts.name,
							default: this.column.name
						},
						width: {
							type: 'number',
							label: this.$ts.width,
							default: this.column.width
						},
						flexible: {
							type: 'boolean',
							label: this.$ts.flexible,
							default: this.column.flexible
						}
					});
					if (canceled) return;
					updateColumn(this.column.id, result);
				}
			}, null, {
				icon: 'fas fa-arrow-left',
				text: this.$ts._deck.swapLeft,
				action: () => {
					swapLeftColumn(this.column.id);
				}
			}, {
				icon: 'fas fa-arrow-right',
				text: this.$ts._deck.swapRight,
				action: () => {
					swapRightColumn(this.column.id);
				}
			}, this.isStacked ? {
				icon: 'fas fa-arrow-up',
				text: this.$ts._deck.swapUp,
				action: () => {
					swapUpColumn(this.column.id);
				}
			} : undefined, this.isStacked ? {
				icon: 'fas fa-arrow-down',
				text: this.$ts._deck.swapDown,
				action: () => {
					swapDownColumn(this.column.id);
				}
			} : undefined, null, {
				icon: 'fas fa-window-restore',
				text: this.$ts._deck.stackLeft,
				action: () => {
					stackLeftColumn(this.column.id);
				}
			}, this.isStacked ? {
				icon: 'fas fa-window-maximize',
				text: this.$ts._deck.popRight,
				action: () => {
					popRightColumn(this.column.id);
				}
			} : undefined, null, {
				icon: 'fas fa-trash-alt',
				text: this.$ts.remove,
				danger: true,
				action: () => {
					removeColumn(this.column.id);
				}
			}];

			return items;
		},

		onContextmenu(e) {
			os.contextMenu(this.getMenu(), e);
		},

		goTop() {
			this.$refs.body.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		},

		onDragstart(e) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData(_DATA_TRANSFER_DECK_COLUMN_, this.column.id);

			// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
			// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
			setTimeout(() => {
				this.dragging = true;
			}, 10);
		},

		onDragend(e) {
			this.dragging = false;
		},

		onDragover(e) {
			// 自分自身がドラッグされている場合
			if (this.dragging) {
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none';
				return;
			}

			const isDeckColumn = e.dataTransfer.types[0] == _DATA_TRANSFER_DECK_COLUMN_;

			e.dataTransfer.dropEffect = isDeckColumn ? 'move' : 'none';

			if (!this.dragging && isDeckColumn) this.draghover = true;
		},

		onDragleave() {
			this.draghover = false;
		},

		onDrop(e) {
			this.draghover = false;
			os.deckGlobalEvents.emit('column.dragEnd');

			const id = e.dataTransfer.getData(_DATA_TRANSFER_DECK_COLUMN_);
			if (id != null && id != '') {
				swapColumn(this.column.id, id);
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.dnpfarvg {
	--root-margin: 10px;

	height: 100%;
	overflow: hidden;
	contain: content;
	box-shadow: 0 0 8px 0 var(--shadow);

	&.draghover {
		box-shadow: 0 0 0 2px var(--focus);

		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--focus);
		}
	}

	&.dragging {
		box-shadow: 0 0 0 2px var(--focus);
	}

	&.dropready {
		* {
			pointer-events: none;
		}
	}

	&:not(.active) {
		flex-basis: var(--deckColumnHeaderHeight);
		min-height: var(--deckColumnHeaderHeight);

		> header.indicated {
			box-shadow: 4px 0px var(--accent) inset;
		}
	}

	&.naked {
		background: var(--acrylicBg) !important;
		-webkit-backdrop-filter: var(--blur, blur(10px));
		backdrop-filter: var(--blur, blur(10px));

		> header {
			background: transparent;
			box-shadow: none;

			> button {
				color: var(--fg);
			}
		}
	}

	&.paged {
		background: var(--bg) !important;
	}

	> header {
		position: relative;
		display: flex;
		z-index: 2;
		line-height: var(--deckColumnHeaderHeight);
		height: var(--deckColumnHeaderHeight);
		padding: 0 16px;
		font-size: 0.9em;
		color: var(--panelHeaderFg);
		background: var(--panelHeaderBg);
		box-shadow: 0 1px 0 0 var(--panelHeaderDivider);
		cursor: pointer;

		&, * {
			user-select: none;
		}

		&.indicated {
			box-shadow: 0 3px 0 0 var(--accent);
		}

		> .header {
			display: inline-block;
			align-items: center;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		> span:only-of-type {
			width: 100%;
		}

		> .toggleActive,
		> .action > ::v-deep(*),
		> .menu {
			z-index: 1;
			width: var(--deckColumnHeaderHeight);
			line-height: var(--deckColumnHeaderHeight);
			font-size: 16px;
			color: var(--faceTextButton);

			&:hover {
				color: var(--faceTextButtonHover);
			}

			&:active {
				color: var(--faceTextButtonActive);
			}
		}

		> .toggleActive, > .action {
			margin-left: -16px;
		}

		> .action {
			z-index: 1;
		}

		> .action:empty {
			display: none;
		}

		> .menu {
			margin-left: auto;
			margin-right: -16px;
		}
	}

	> div {
		height: calc(100% - var(--deckColumnHeaderHeight));
		overflow: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		box-sizing: border-box;
	}
}
</style>
