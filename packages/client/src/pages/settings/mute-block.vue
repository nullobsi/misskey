<template>
<FormBase>
	<MkTab v-model="tab" style="margin-bottom: var(--margin);">
		<option value="mute">{{ $ts.mutedUsers }}</option>
		<option value="block">{{ $ts.blockedUsers }}</option>
	</MkTab>
	<div v-if="tab === 'mute'">
		<MkPagination :pagination="mutingPagination" class="muting">
			<template #empty><FormInfo>{{ $ts.noUsers }}</FormInfo></template>
			<template #default="{items}">
				<FormGroup>
					<FormLink v-for="mute in items" :key="mute.id" :to="userPage(mute.mutee)">
						<MkAcct :user="mute.mutee"/>
					</FormLink>
				</FormGroup>
			</template>
		</MkPagination>
	</div>
	<div v-if="tab === 'block'">
		<MkPagination :pagination="blockingPagination" class="blocking">
			<template #empty><FormInfo>{{ $ts.noUsers }}</FormInfo></template>
			<template #default="{items}">
				<FormGroup>
					<FormLink v-for="block in items" :key="block.id" :to="userPage(block.blockee)">
						<MkAcct :user="block.blockee"/>
					</FormLink>
				</FormGroup>
			</template>
		</MkPagination>
	</div>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkTab from '@/components/tab.vue';
import FormInfo from '@/components/debobigego/info.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkPagination,
		MkTab,
		FormInfo,
		FormBase,
		FormGroup,
		FormLink,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.muteAndBlock,
				icon: 'fas fa-ban',
				bg: 'var(--bg)',
			},
			tab: 'mute',
			mutingPagination: {
				endpoint: 'mute/list',
				limit: 10,
			},
			blockingPagination: {
				endpoint: 'blocking/list',
				limit: 10,
			},
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		userPage
	}
});
</script>
