import $ from 'cafy';
import define from '../../../define';
import { ID } from '@/misc/cafy-id';
import { convertLog } from '@/services/chart/core';
import { perUserNotesChart } from '@/services/chart/index';

export const meta = {
	tags: ['charts', 'users', 'notes'],
	requireCredentialPrivateMode: true as const,

	params: {
		span: {
			validator: $.str.or(['day', 'hour']),
		},

		limit: {
			validator: $.optional.num.range(1, 500),
			default: 30,
		},

		offset: {
			validator: $.optional.nullable.num,
			default: null,
		},

		userId: {
			validator: $.type(ID),
		}
	},

	res: convertLog(perUserNotesChart.schema),
};

export default define(meta, async (ps) => {
	return await perUserNotesChart.getChart(ps.span as any, ps.limit!, ps.offset ? new Date(ps.offset) : null, ps.userId);
});
