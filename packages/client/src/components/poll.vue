<template>
<div class="tivcixzd" :class="{ done: closed || isVoted }">
	<ul>
		<li v-for="(choice, i) in poll.choices" :key="i" :class="{ voted: choice.voted }" @click="vote(i)">
			<div class="backdrop" :style="{ 'width': `${showResult ? (choice.votes / total * 100) : 0}%` }"></div>
			<span>
				<template v-if="choice.isVoted"><i class="fas fa-check"></i></template>
				<Mfm :text="choice.text" :plain="true" :custom-emojis="note.emojis"/>
				<span v-if="showResult" class="votes">({{ $t('_poll.votesCount', { n: choice.votes }) }})</span>
			</span>
		</li>
	</ul>
	<p v-if="!readOnly">
		<span>{{ $t('_poll.totalVotes', { n: total }) }}</span>
		<span> · </span>
		<a v-if="!closed && !isVoted" @click="toggleShowResult">{{ showResult ? $ts._poll.vote : $ts._poll.showResult }}</a>
		<span v-if="isVoted">{{ $ts._poll.voted }}</span>
		<span v-else-if="closed">{{ $ts._poll.closed }}</span>
		<span v-if="remaining > 0"> · {{ timer }}</span>
	</p>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { sum } from '@/scripts/array';
import * as os from '@/os';

export default defineComponent({
	props: {
		note: {
			type: Object,
			required: true
		},
		readOnly: {
			type: Boolean,
			required: false,
			default: false,
		}
	},
	data() {
		return {
			remaining: -1,
			showResult: false,
		};
	},
	computed: {
		poll(): any {
			return this.note.poll;
		},
		total(): number {
			return sum(this.poll.choices.map(x => x.votes));
		},
		closed(): boolean {
			return !this.remaining;
		},
		timer(): string {
			return this.$t(
				this.remaining >= 86400 ? '_poll.remainingDays' :
				this.remaining >= 3600 ? '_poll.remainingHours' :
				this.remaining >= 60 ? '_poll.remainingMinutes' : '_poll.remainingSeconds', {
					s: Math.floor(this.remaining % 60),
					m: Math.floor(this.remaining / 60) % 60,
					h: Math.floor(this.remaining / 3600) % 24,
					d: Math.floor(this.remaining / 86400)
				});
		},
		isVoted(): boolean {
			return !this.poll.multiple && this.poll.choices.some(c => c.isVoted);
		}
	},
	created() {
		this.showResult = this.readOnly || this.isVoted;

		if (this.note.poll.expiresAt) {
			const update = () => {
				if (this.remaining = Math.floor(Math.max(new Date(this.note.poll.expiresAt).getTime() - Date.now(), 0) / 1000))
					requestAnimationFrame(update);
				else
					this.showResult = true;
			};

			update();
		}
	},
	methods: {
		toggleShowResult() {
			this.showResult = !this.showResult;
		},
		vote(id) {
			if (this.readOnly || this.closed || !this.poll.multiple && this.poll.choices.some(c => c.isVoted)) return;
			os.api('notes/polls/vote', {
				noteId: this.note.id,
				choice: id
			}).then(() => {
				if (!this.showResult) this.showResult = !this.poll.multiple;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.tivcixzd {
	> ul {
		display: block;
		margin: 0;
		padding: 0;
		list-style: none;

		> li {
			display: block;
			position: relative;
			margin: 4px 0;
			padding: 4px 8px;
			border: solid 0.5px var(--divider);
			border-radius: 4px;
			overflow: hidden;
			cursor: pointer;

			&:hover {
				background: rgba(#000, 0.05);
			}

			&:active {
				background: rgba(#000, 0.1);
			}

			> .backdrop {
				position: absolute;
				top: 0;
				left: 0;
				height: 100%;
				background: var(--accent);
				transition: width 1s ease;
			}

			> span {
				position: relative;

				> i {
					margin-right: 4px;
				}

				> .votes {
					margin-left: 4px;
				}
			}
		}
	}

	> p {
		color: var(--fg);

		a {
			color: inherit;
		}
	}

	&.done {
		> ul > li {
			cursor: default;

			&:hover {
				background: transparent;
			}

			&:active {
				background: transparent;
			}
		}
	}
}
</style>
