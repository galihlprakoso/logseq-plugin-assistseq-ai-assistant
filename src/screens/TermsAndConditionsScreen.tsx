import React, { useCallback } from "react"
import Card from "../modules/shared/components/Card"
import MarkdownRenderer from "../modules/shared/components/MarkdownRenderer"
import useFlagsStore from "../modules/shared/stores/useFlagsStore"

const TERMS_AND_CONDITIONS = `# Terms and Conditions for AssistSeq - AI Assistant

Last Updated: 18th August 2024

These Terms and Conditions ("Terms") govern your use of the AssistSeq - AI Assistant plugin ("the Plugin"). By using the Plugin, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Plugin.

### 1. **Local Storage of API Keys**
All API keys provided by the user for the Plugin’s operation are stored locally on your device. The developer of AssistSeq - AI Assistant does not have access to or store these API keys on any external servers or third-party services.

### 2. **Data Privacy and Security**
The Plugin accesses your LogSeq documents to provide context-aware assistance. While the developer has implemented certain features to enhance data privacy and security, such as:
   - **Page and Word Blacklists:** Users can specify pages and words to exclude from the Plugin’s context, preventing sensitive information from being processed.
   
   Despite these measures, the developer cannot guarantee absolute security of your data. Users are responsible for ensuring that their data is protected. The developer is not liable for any data breaches, leaks, or unintended disclosures that may occur while using the Plugin.

### 3. **User Responsibility**
- **Appropriate Use:** Users are responsible for using the Plugin in accordance with all applicable laws and regulations. The Plugin should not be used to process, store, or transmit sensitive or classified information unless adequate safeguards are in place.
  
- **Data Backup:** Users should regularly back up their LogSeq documents and any associated data. The developer is not responsible for any data loss or corruption that may occur while using the Plugin.

### 4. **Limitations of Liability**
To the fullest extent permitted by law, the developer of AssistSeq - AI Assistant is not liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Plugin. This includes, but is not limited to, damages for loss of data, unauthorized access, or other breaches of privacy.

### 5. **Disclaimer of Warranties**
The Plugin is provided "as is" without warranties of any kind, either express or implied. The developer makes no representations or warranties regarding the reliability, functionality, or security of the Plugin. Users acknowledge that they use the Plugin at their own risk.

### 6. **Updates and Changes**
The developer reserves the right to modify or update these Terms at any time. Users will be notified of significant changes, and continued use of the Plugin after such changes constitutes acceptance of the new Terms.

### 7. **Support and Contact**
For any questions, support, or concerns regarding the Plugin, users can contact the developer at galihlprakoso@gmail.com.

### 8. **Governing Law**
These Terms shall be governed by and construed in accordance with the laws of Indonesia, without regard to its conflict of law principles.

By using AssistSeq - AI Assistant, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
`

const TermsAndConditionsScreen: React.FC = () => {
  const {acceptTermsAndConditions} = useFlagsStore()

  const onTOAInputChecked = useCallback<React.ChangeEventHandler<HTMLInputElement>>((e) => {
    if (e.target.checked) {
      acceptTermsAndConditions()
    }
  }, [acceptTermsAndConditions])

  return (
    <Card className="h-full relative flex items-center justify-center flex-col p-4 overflow-hidden">
      <div className="h-full overflow-y-scroll pb-28 pt-16">
        <MarkdownRenderer markdown={TERMS_AND_CONDITIONS} />
      </div>

      <div className="w-full bg-white absolute bottom-0 left-0 right-0 p-4 flex items-center justify-end">
        <input id="terms-and-conditions-check" type="checkbox" onChange={onTOAInputChecked} value="" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
        <label htmlFor="terms-and-conditions-check" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">I agree with the <strong>terms and conditions</strong>.</label>
      </div>
    </Card>
  )
}

export default TermsAndConditionsScreen