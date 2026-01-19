// Email Template Service
// Manages email templates stored in database

import supabase from '../config/supabase.config';
import { ServiceResponse, success, failure } from './service.result';
import { EmailTemplate, EmailTemplateType } from '../types/database.types';

/**
 * Get email template by type
 */
export const getEmailTemplate = async (
  templateType: EmailTemplateType
): Promise<ServiceResponse<EmailTemplate>> => {
  try {
    const { data, error } = await supabase
      .from('email_template')
      .select('*')
      .eq('template_type', templateType)
      .single();

    if (error || !data) {
      return failure(`Email template '${templateType}' not found`);
    }

    return success(data);
  } catch (error) {
    console.error('getEmailTemplate error:', error);
    return failure('Server error retrieving email template');
  }
};

/**
 * Replace placeholders in template content
 * Supports placeholders like {{variableName}}
 */
export const replaceTemplatePlaceholders = (
  template: string,
  variables: Record<string, string | number | null | undefined>
): string => {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const replacement = value !== null && value !== undefined ? String(value) : '';
    result = result.replace(placeholder, replacement);
  }

  return result;
};

/**
 * Get and render email template with variables
 */
export const renderEmailTemplate = async (
  templateType: EmailTemplateType,
  variables: Record<string, string | number | null | undefined>
): Promise<ServiceResponse<{ subject: string; html: string; text?: string }>> => {
  try {
    const templateResult = await getEmailTemplate(templateType);

    if (!templateResult.success || !templateResult.data) {
      return failure(templateResult.error || 'Template not found');
    }

    const template = templateResult.data;

    const subject = replaceTemplatePlaceholders(template.subject, variables);
    const html = replaceTemplatePlaceholders(template.html_content, variables);
    const text = template.text_content
      ? replaceTemplatePlaceholders(template.text_content, variables)
      : undefined;

    return success({
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error('renderEmailTemplate error:', error);
    return failure('Server error rendering email template');
  }
};
