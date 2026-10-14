-- Шаблон заявления привязывается к типу заявки (один на тип)
ALTER TABLE "DocumentTemplate" ADD COLUMN "requestType" "RequestType";
CREATE UNIQUE INDEX "DocumentTemplate_requestType_key" ON "DocumentTemplate"("requestType");
