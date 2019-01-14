using AnnotationTool.Bean;
using Newtonsoft.Json;
using System.IO;
using System.Web;
using System.Web.Http;

namespace AnnotationTool.API
{
    public class AuthenticateController : ApiController
    {

        public const int INVALID_USER = -1;
        public const int UNKNOWN_ROLE = 0;

        [HttpGet]
        [Route("api/authenticate")]
        public int Authenticate(string username, string password)
        {
            int foundRole = lookupUser(username, password);
            //HttpContext.Current.Session["user"] = username;
            //HttpContext.Current.Session["role"] = foundRole;
            //return foundRole != INVALID_USER;
            return foundRole;
        }

        private int lookupUser(string username, string password)
        {
            string roleForUser = findUserRole(username, password);
            if (roleForUser != null)
            {
                return accessForRole(roleForUser);
            } else
            {
                return INVALID_USER;
            }
        }

        private int accessForRole(string roleForUser)
        {
            using (StreamReader r = new StreamReader(System.Web.HttpContext.Current.Server.MapPath("~/Security/Roles.txt")))
            {
                string json = r.ReadToEnd();
                RoleList roles = JsonConvert.DeserializeObject<RoleList>(json);
                foreach (Role role in roles.roles)
                {
                    if (role.name == roleForUser)
                    {
                        return role.access;
                    }
                }
            }
            return UNKNOWN_ROLE;
        }

        private string findUserRole(string username, string password)
        {
            using (StreamReader r = new StreamReader(System.Web.HttpContext.Current.Server.MapPath("~/Security/Users.txt")))
            {
                string json = r.ReadToEnd();
                UserList users = JsonConvert.DeserializeObject<UserList>(json);
                foreach (User user in users.users)
                {
                    if (user.name == username && user.password == password)
                    {
                        return user.role;
                    }
                }
            }
            return null;
        }
    }

}