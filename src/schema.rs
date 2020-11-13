table! {
    use diesel::sql_types::*;
    use crate::models::enums::*;

    access_keys (public_key, account_id) {
        public_key -> Text,
        account_id -> Text,
        created_by_receipt_id -> Nullable<Text>,
        deleted_by_receipt_id -> Nullable<Text>,
        permission_kind -> Access_key_permission_kind,
        last_update_block_height -> Numeric,
    }
}

table! {
    use diesel::sql_types::*;

    accounts (id) {
        id -> Int8,
        account_id -> Text,
        created_by_receipt_id -> Nullable<Text>,
        deleted_by_receipt_id -> Nullable<Text>,
        last_update_block_height -> Numeric,
    }
}

table! {
    use diesel::sql_types::*;
    use crate::models::enums::*;

    action_receipt_actions (receipt_id, index_in_action_receipt) {
        receipt_id -> Text,
        index_in_action_receipt -> Int4,
        action_kind -> Action_kind,
        args -> Jsonb,
    }
}

table! {
    use diesel::sql_types::*;

    action_receipt_input_data (input_data_id, input_to_receipt_id) {
        input_data_id -> Text,
        input_to_receipt_id -> Text,
    }
}

table! {
    use diesel::sql_types::*;

    action_receipt_output_data (output_data_id, output_from_receipt_id) {
        output_data_id -> Text,
        output_from_receipt_id -> Text,
        receiver_account_id -> Text,
    }
}

table! {
    use diesel::sql_types::*;

    action_receipts (receipt_id) {
        receipt_id -> Text,
        signer_account_id -> Text,
        signer_public_key -> Text,
        gas_price -> Numeric,
    }
}

table! {
    use diesel::sql_types::*;

    blocks (block_hash) {
        block_height -> Numeric,
        block_hash -> Text,
        prev_block_hash -> Text,
        block_timestamp -> Numeric,
        total_supply -> Numeric,
        gas_price -> Numeric,
        author_account_id -> Text,
    }
}

table! {
    use diesel::sql_types::*;

    chunks (chunk_hash) {
        included_in_block_hash -> Text,
        chunk_hash -> Text,
        shard_id -> Numeric,
        signature -> Text,
        gas_limit -> Numeric,
        gas_used -> Numeric,
        author_account_id -> Text,
    }
}

table! {
    use diesel::sql_types::*;

    data_receipts (data_id) {
        data_id -> Text,
        receipt_id -> Text,
        data -> Nullable<Bytea>,
    }
}

table! {
    use diesel::sql_types::*;

    execution_outcome_receipts (executed_receipt_id, index_in_execution_outcome, produced_receipt_id) {
        executed_receipt_id -> Text,
        index_in_execution_outcome -> Int4,
        produced_receipt_id -> Text,
    }
}

table! {
    use diesel::sql_types::*;
    use crate::models::enums::*;

    execution_outcomes (receipt_id) {
        receipt_id -> Text,
        executed_in_block_hash -> Text,
        gas_burnt -> Numeric,
        tokens_burnt -> Numeric,
        executor_account_id -> Text,
        status -> Execution_outcome_status,
    }
}

table! {
    use diesel::sql_types::*;
    use crate::models::enums::*;

    receipts (receipt_id) {
        receipt_id -> Text,
        included_in_block_hash -> Text,
        included_in_chunk_hash -> Text,
        index_in_chunk -> Int4,
        included_in_block_timestamp -> Numeric,
        predecessor_account_id -> Text,
        receiver_account_id -> Text,
        receipt_kind -> Receipt_kind,
        originated_from_transaction_hash -> Text,
    }
}

table! {
    use diesel::sql_types::*;
    use crate::models::enums::*;

    transaction_actions (transaction_hash, index_in_transaction) {
        transaction_hash -> Text,
        index_in_transaction -> Int4,
        action_kind -> Action_kind,
        args -> Jsonb,
    }
}

table! {
    use diesel::sql_types::*;
    use crate::models::enums::*;

    transactions (transaction_hash) {
        transaction_hash -> Text,
        included_in_block_hash -> Text,
        included_in_chunk_hash -> Text,
        index_in_chunk -> Int4,
        block_timestamp -> Numeric,
        signer_account_id -> Text,
        signer_public_key -> Text,
        nonce -> Numeric,
        receiver_account_id -> Text,
        signature -> Text,
        status -> Execution_outcome_status,
        converted_into_receipt_id -> Text,
        receipt_conversion_gas_burnt -> Nullable<Numeric>,
        receipt_conversion_tokens_burnt -> Nullable<Numeric>,
    }
}

joinable!(action_receipt_actions -> receipts (receipt_id));
joinable!(chunks -> blocks (included_in_block_hash));
joinable!(execution_outcome_receipts -> execution_outcomes (executed_receipt_id));
joinable!(execution_outcome_receipts -> receipts (executed_receipt_id));
joinable!(execution_outcomes -> blocks (executed_in_block_hash));
joinable!(execution_outcomes -> receipts (receipt_id));
joinable!(receipts -> blocks (included_in_block_hash));
joinable!(receipts -> chunks (included_in_chunk_hash));
joinable!(receipts -> transactions (originated_from_transaction_hash));
joinable!(transaction_actions -> transactions (transaction_hash));
joinable!(transactions -> blocks (included_in_block_hash));
joinable!(transactions -> chunks (included_in_chunk_hash));

allow_tables_to_appear_in_same_query!(
    access_keys,
    accounts,
    action_receipt_actions,
    action_receipt_input_data,
    action_receipt_output_data,
    action_receipts,
    blocks,
    chunks,
    data_receipts,
    execution_outcome_receipts,
    execution_outcomes,
    receipts,
    transaction_actions,
    transactions,
);
