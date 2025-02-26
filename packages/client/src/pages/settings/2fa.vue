<template>
<section class="_card">
	<div class="_title"><i class="fas fa-lock"></i> {{ $ts.twoStepAuthentication }}</div>
	<div class="_content">
		<MkButton v-if="!data && !$i.twoFactorEnabled" @click="register">{{ $ts._2fa.registerDevice }}</MkButton>
		<template v-if="$i.twoFactorEnabled">
			<p>{{ $ts._2fa.alreadyRegistered }}</p>
			<MkButton @click="unregister">{{ $ts.unregister }}</MkButton>

			<template v-if="supportsCredentials">
				<hr class="totp-method-sep">

				<h2 class="heading">{{ $ts.securityKey }}</h2>
				<p>{{ $ts._2fa.securityKeyInfo }}</p>
				<div class="key-list">
					<div v-for="key in $i.securityKeysList" class="key">
						<h3>{{ key.name }}</h3>
						<div class="last-used">{{ $ts.lastUsed }}<MkTime :time="key.lastUsed"/></div>
						<MkButton @click="unregisterKey(key)">{{ $ts.unregister }}</MkButton>
					</div>
				</div>

				<MkSwitch v-if="$i.securityKeysList.length > 0" v-model="usePasswordLessLogin" @update:modelValue="updatePasswordLessLogin">{{ $ts.passwordLessLogin }}</MkSwitch>

				<MkInfo v-if="registration && registration.error" warn>{{ $ts.error }} {{ registration.error }}</MkInfo>
				<MkButton v-if="!registration || registration.error" @click="addSecurityKey">{{ $ts._2fa.registerKey }}</MkButton>

				<ol v-if="registration && !registration.error">
					<li v-if="registration.stage >= 0">
						{{ $ts.tapSecurityKey }}
						<i v-if="registration.saving && registration.stage == 0" class="fas fa-spinner fa-pulse fa-fw"></i>
					</li>
					<li v-if="registration.stage >= 1">
						<MkForm :disabled="registration.stage != 1 || registration.saving">
							<MkInput v-model="keyName" :max="30">
								<template #label>{{ $ts.securityKeyName }}</template>
							</MkInput>
							<MkButton :disabled="keyName.length == 0" @click="registerKey">{{ $ts.registerSecurityKey }}</MkButton>
							<i v-if="registration.saving && registration.stage == 1" class="fas fa-spinner fa-pulse fa-fw"></i>
						</MkForm>
					</li>
				</ol>
			</template>
		</template>
		<div v-if="data && !$i.twoFactorEnabled">
			<ol style="margin: 0; padding: 0 0 0 1em;">
				<li>
					<I18n :src="$ts._2fa.step1" tag="span">
						<template #a>
							<a href="https://authy.com/" rel="noopener" target="_blank" class="_link">Authy</a>
						</template>
						<template #b>
							<a href="https://support.google.com/accounts/answer/1066447" rel="noopener" target="_blank" class="_link">Google Authenticator</a>
						</template>
					</I18n>
				</li>
				<li>{{ $ts._2fa.step2 }}<br><img :src="data.qr"></li>
				<li>{{ $ts._2fa.step3 }}<br>
					<MkInput v-model="token" type="text" pattern="^[0-9]{6}$" autocomplete="off" spellcheck="false"><template #label>{{ $ts.token }}</template></MkInput>
					<MkButton primary @click="submit">{{ $ts.done }}</MkButton>
				</li>
			</ol>
			<MkInfo>{{ $ts._2fa.step4 }}</MkInfo>
		</div>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { hostname } from '@/config';
import { byteify, hexify, stringify } from '@/scripts/2fa';
import MkButton from '@/components/ui/button.vue';
import MkInfo from '@/components/ui/info.vue';
import MkInput from '@/components/form/input.vue';
import MkSwitch from '@/components/form/switch.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		MkButton, MkInfo, MkInput, MkSwitch
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.twoStepAuthentication,
				icon: 'fas fa-lock'
			},
			data: null,
			supportsCredentials: !!navigator.credentials,
			usePasswordLessLogin: this.$i.usePasswordLessLogin,
			registration: null,
			keyName: '',
			token: null,
		};
	},

	methods: {
		register() {
			os.inputText({
				title: this.$ts.password,
				type: 'password'
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/2fa/register', {
					password: password
				}).then(data => {
					this.data = data;
				});
			});
		},

		unregister() {
			os.inputText({
				title: this.$ts.password,
				type: 'password'
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/2fa/unregister', {
					password: password
				}).then(() => {
					this.usePasswordLessLogin = false;
					this.updatePasswordLessLogin();
				}).then(() => {
					os.success();
					this.$i.twoFactorEnabled = false;
				});
			});
		},

		submit() {
			os.api('i/2fa/done', {
				token: this.token
			}).then(() => {
				os.success();
				this.$i.twoFactorEnabled = true;
			}).catch(e => {
				os.alert({
					type: 'error',
					text: e
				});
			});
		},

		registerKey() {
			this.registration.saving = true;
			os.api('i/2fa/key-done', {
				password: this.registration.password,
				name: this.keyName,
				challengeId: this.registration.challengeId,
				// we convert each 16 bits to a string to serialise
				clientDataJSON: stringify(this.registration.credential.response.clientDataJSON),
				attestationObject: hexify(this.registration.credential.response.attestationObject)
			}).then(key => {
				this.registration = null;
				key.lastUsed = new Date();
				os.success();
			})
		},

		unregisterKey(key) {
			os.inputText({
				title: this.$ts.password,
				type: 'password'
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				return os.api('i/2fa/remove-key', {
					password,
					credentialId: key.id
				}).then(() => {
					this.usePasswordLessLogin = false;
					this.updatePasswordLessLogin();
				}).then(() => {
					os.success();
				});
			});
		},

		addSecurityKey() {
			os.inputText({
				title: this.$ts.password,
				type: 'password'
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/2fa/register-key', {
					password
				}).then(registration => {
					this.registration = {
						password,
						challengeId: registration.challengeId,
						stage: 0,
						publicKeyOptions: {
							challenge: byteify(registration.challenge, 'base64'),
							rp: {
								id: hostname,
								name: 'Misskey'
							},
							user: {
								id: byteify(this.$i.id, 'ascii'),
								name: this.$i.username,
								displayName: this.$i.name,
							},
							pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
							timeout: 60000,
							attestation: 'direct'
						},
						saving: true
					};
					return navigator.credentials.create({
						publicKey: this.registration.publicKeyOptions
					});
				}).then(credential => {
					this.registration.credential = credential;
					this.registration.saving = false;
					this.registration.stage = 1;
				}).catch(err => {
					console.warn('Error while registering?', err);
					this.registration.error = err.message;
					this.registration.stage = -1;
				});
			});
		},

		updatePasswordLessLogin() {
			os.api('i/2fa/password-less', {
				value: !!this.usePasswordLessLogin
			});
		}
	}
});
</script>
