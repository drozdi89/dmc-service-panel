import type { components, operations } from '@/shared/api';
import type { PaginatedResponse } from '@/shared/types/listQuery';

/** Query parameters for GET /api/v2/tasks/list (OpenAPI tasks_list_get). */
export type TasksListQuery = NonNullable<
  operations['tasks_list_get_api_v2_tasks_list_get']['parameters']['query']
>;

/** View level for tasks list endpoint. */
export type TaskListView = NonNullable<TasksListQuery['view']>;

/** Filter interval type (FilterData.filter_type). */
export type TaskFilterType = NonNullable<TasksListQuery['filter_type']>;

/** Embedded counters on a task card (count field, without taskid). */
export type TaskCountData = Omit<
  components['schemas']['TaskCountDataSchema'],
  'taskid'
>;

/** Brief production line on a task card. */
export interface TaskLineBrief {
  id: number;
  name: string;
  line_type: string;
  is_manual: boolean;
  is_scaled: boolean;
}

/** Brief product on a task card (no print templates). */
export interface TaskProductBrief {
  gtin: string;
  name: string;
  pg?: string | number | null;
  type: string;
  crpt_inn?: string | null;
  lifetime: number;
  lifetime_unit: string;
  mrp: number;
  is_imported: boolean;
  measure_unit: string;
  beer_volume_ml: number;
  auto_send_introduce: boolean;
  auto_send_apply: boolean;
  vet_control: boolean;
  owner_inn?: string | null;
  contract_commissioning: boolean;
}

/** Aggregation dimension without template body (card view). */
export interface TaskDimensionBrief {
  id: number;
  size: number;
  name: string;
  gtin: string;
}

/**
 * Task card DTO from GET /api/v2/tasks/list?view=card.
 *
 * `TaskCardSchema` is not yet in the generated OpenAPI client types (see plan #12).
 * Keep this interface manually aligned with backend `TaskCardSchema` in
 * `apps/api/client/api/v2/schema_v2/tasks_read_schema.py` and example
 * `TASK_LIST_CARD_SUCCESS` in `apps/api/client/openapi/examples_production.py`.
 */
export interface TaskCard {
  taskid: number;
  status: number;
  revision: number | null;
  amount: number;
  taskdate: string;
  mandate: string;
  msg: string;
  expiration_date: string | null;
  error_state: boolean;
  origin_taskid: number | null;
  use_printed_dm: boolean;
  include_printed_dm: boolean;
  print_plain_template: boolean;
  stock_number: string;
  boiler_number: string;
  shift_number: number;
  personal: boolean;
  dt_number: string;
  dt_date: string | null;
  payment_on_emission: boolean;
  last_updated: string;
  marking_system: string;
  send_codes_up_to_number: number;
  parent_task_id: number | null;
  use_fixed_mandate: boolean;
  mandate_from_scandate: boolean;
  task_type: string;
  crpt_mod: string;
  vsd: string;
  line: TaskLineBrief;
  product: TaskProductBrief;
  count: TaskCountData;
  aggregates: Record<string, TaskCountData>;
  dimensions: Record<string, TaskDimensionBrief>;
}

/** Paginated tasks list response envelope. */
export type TaskListResponse = PaginatedResponse<TaskCard>;

/** Default list params for Web Manager task grid (card view, first page). */
export const DEFAULT_TASKS_LIST_PARAMS: TasksListQuery = {
  size: 100,
  number: 0,
  view: 'card',
};
