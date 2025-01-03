export enum ERRORS_MSG {
    USER_NOT_FOUND = 'Пользователь не найден',
  
    FORBIDDEN_MSG = 'Вы не можете совершить данную операцию',
  
    USER_EXIST_ERR_MSG = 'Пользователь с такими данными уже существует',
  
    NOT_RULES = 'Недостаточно прав для данной операции',

    WRONG_CODE = "Неправильный код подтверждения",

    EXPIRED_ERROR = "Истек срок действия",

    SEND_SMS_ERROR = "Возникла ошибка при отправке СМС, повторите попытку."
  }
  

  export enum SUCCESS_MSG {
    DEFAULT_SUCCESS_MSG_FOR_HTTP = "success"
  }