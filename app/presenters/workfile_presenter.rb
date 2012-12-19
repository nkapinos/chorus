class WorkfilePresenter < Presenter

  def to_hash
    if options[:workfile_as_latest_version] && model.latest_workfile_version
      version_options = options.dup
      version_options.delete :workfile_as_latest_version

      return present(model.latest_workfile_version, version_options)
    end

    notes = model.notes
    comments = model.comments

    recent_comments = [notes.last,
                       comments.last].compact
    recent_comments = *recent_comments.sort_by(&:created_at).last

    workfile = {
      :id => model.id,
      :workspace => present(model.workspace, @options),
      :file_name => model.file_name,
      :file_type => model.content_type,
      :latest_version_id => model.latest_workfile_version_id,
      :is_deleted => model.deleted?,
      :recent_comments => present(recent_comments, :as_comment => true),
      :comment_count => comments.count + notes.count,
      :tags => present(model.tags, @options)
    }

    unless rendering_activities?
      workfile.merge!({
        :owner => present(model.owner),
        :has_draft => model.has_draft(current_user)
      })
    end
    workfile[:execution_schema] = present(model.execution_schema) if options[:include_execution_schema]
    workfile
  end

  def complete_json?
    options[:include_execution_schema] && !rendering_activities?
  end
end
