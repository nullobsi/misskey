<template>
<div>
	<MkPagination #default="{items}" :pagination="pagination">
		<div class="jrnovfpt">
			<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkGalleryPostPreview from '@/components/gallery-post-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkGalleryPostPreview,
	},

	props: {
		user: {
			type: Object,
			required: true
		},
	},

	data() {
		return {
			pagination: {
				endpoint: 'users/gallery/posts',
				limit: 6,
				params: () => ({
					userId: this.user.id
				})
			},
		};
	},

	watch: {
		user() {
			this.$refs.list.reload();
		}
	}
});
</script>

<style lang="scss" scoped>
.jrnovfpt {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: var(--margin);
}
</style>
