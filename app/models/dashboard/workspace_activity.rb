module Dashboard
  class WorkspaceActivity < DataModule

    def fetch_results
      num_days = 7
      num_workspaces = 10
      start_date = num_days.days.ago.at_beginning_of_day

      # Get the top 10 workspaces since start_date
      top_workspace_ids = Events::Base
        .select('workspace_id, count(*) as event_count')
        .group(:workspace_id)
        .where('workspace_id IS NOT NULL')
        .where('created_at >= :start_date', :start_date => start_date)
        .order('event_count desc')
        .limit(num_workspaces)
      .map(&:workspace_id)

      # Get event counts grouped by day and workspace
      events_by_day_workspace = Events::Base
        .group(:workspace_id, "date_trunc('day', created_at)")
        .where('workspace_id IN (:workspace_ids)', :workspace_ids => top_workspace_ids)
        .where('created_at >= :start_date', :start_date => start_date)
      .count

      # Fill in gaps
      (0..num_days).each do |d|
        top_workspace_ids.each do |id|
          events_by_day_workspace[[id, d.days.ago.strftime('%F 00:00:00')]] ||= 0
        end
      end

      # Sort by date
      events_by_day_workspace = events_by_day_workspace.sort_by { |k,v| Date.strptime(k.last, '%F %T') }

      # Put in random format for json
      res = events_by_day_workspace.map do |t, v|
        {date_part: t.last,
         workspace_id: t.first,
         event_count: v,
         rank: top_workspace_ids.find_index(t.first)}
      end

      res
    end

    def fetch_results_old
      Events::Base.connection.execute(<<-SQL)
        WITH last_month_weeks AS (
          select date_trunc('week', (current_timestamp - interval '3 week')) as date_part
          UNION
          select date_trunc('week', (current_timestamp - interval '2 week')) as date_part
          UNION
          select date_trunc('week', (current_timestamp - interval '1 week')) as date_part
          UNION
          select date_trunc('week', current_timestamp) as date_part
        ), last_month_top_workspaces AS (
          SELECT count(*) as event_count, workspace_id
          FROM events
          WHERE (
            deleted_at IS NULL
            AND workspace_id IS NOT NULL
            AND created_at > (current_timestamp - interval '4 week')
          )
          GROUP BY workspace_id
          ORDER BY event_count DESC
          LIMIT 10
        ), full_list AS (
          SELECT workspace_id, date_part FROM last_month_top_workspaces CROSS JOIN last_month_weeks
        ), last_month_events AS (
          SELECT workspace_id, date_trunc('week', created_at) AS date_trunc_week_created_at
          FROM events
          WHERE (
            deleted_at IS NULL
            AND workspace_id IS NOT NULL
            AND created_at > (current_timestamp - interval '4 week')
          )
        ), joined AS (
          SELECT full_list.workspace_id, count(last_month_events.workspace_id) AS event_count, full_list.date_part
          FROM
          full_list
          LEFT JOIN last_month_events
            ON last_month_events.workspace_id = full_list.workspace_id
            AND last_month_events.date_trunc_week_created_at = full_list.date_part
          GROUP BY full_list.workspace_id, full_list.date_part
        )
        SELECT * FROM joined order by date_part asc, workspace_id;
      SQL
    end

  end
end
