<template>
<FormBase>
	<FormLink to="/settings/update">Misskey Update</FormLink>

	<FormSwitch :value="$i.injectFeaturedNote" @update:modelValue="onChangeInjectFeaturedNote">
		{{ $ts.showFeaturedNotesInTimeline }}
	</FormSwitch>

	<FormSwitch v-model="reportError">{{ $ts.sendErrorReports }}<template #desc>{{ $ts.sendErrorReportsDescription }}</template></FormSwitch>

	<FormLink to="/settings/account-info">{{ $ts.accountInfo }}</FormLink>
	<FormLink to="/settings/experimental-features">{{ $ts.experimentalFeatures }}</FormLink>

	<FormGroup>
		<template #label>{{ $ts.developer }}</template>
		<FormSwitch v-model="debug" @update:modelValue="changeDebug">
			DEBUG MODE
		</FormSwitch>
		<template v-if="debug">
			<FormButton @click="taskmanager">Task Manager</FormButton>
		</template>
	</FormGroup>

	<FormLink to="/settings/registry"><template #icon><i class="fas fa-cogs"></i></template>{{ $ts.registry }}</FormLink>

	<FormLink to="/bios" behavior="browser"><template #icon><i class="fas fa-door-open"></i></template>BIOS</FormLink>
	<FormLink to="/cli" behavior="browser"><template #icon><i class="fas fa-door-open"></i></template>CLI</FormLink>

	<FormLink to="/settings/delete-account"><template #icon><i class="fas fa-exclamation-triangle"></i></template>{{ $ts.closeAccount }}</FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import * as os from '@/os';
import { debug } from '@/config';
import { defaultStore } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormSelect,
		FormSwitch,
		FormButton,
		FormLink,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.other,
				icon: 'fas fa-ellipsis-h',
				bg: 'var(--bg)',
			},
			debug,
		}
	},

	computed: {
		reportError: defaultStore.makeGetterSetter('reportError'),
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		changeDebug(v) {
			console.log(v);
			localStorage.setItem('debug', v.toString());
			unisonReload();
		},

		onChangeInjectFeaturedNote(v) {
			os.api('i/update', {
				injectFeaturedNote: v
			});
		},

		taskmanager() {
			os.popup(import('@/components/taskmanager.vue'), {
			}, {}, 'closed');
		},
	}
});
</script>
